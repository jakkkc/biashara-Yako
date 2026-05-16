import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
const databaseId = 'ai-studio-604e9c2a-f8ea-4394-aa19-a91d7ed5dfe3';

if (!admin.apps.length && serviceAccount.project_id) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

// Set up named database for admin SDK if credentials exist
if (serviceAccount.project_id) {
  adminDb.settings({ databaseId });
}

app.use(express.json());

// --- SEEDING ---
async function seedSuperAdmin() {
  const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
  if (!ADMIN_EMAIL || !serviceAccount.project_id) {
    console.log('[Seed] SUPER_ADMIN_EMAIL or valid service account not set — skipping seed.');
    return;
  }

  try {
    let uid: string | null = null;
    try {
      const existing = await adminAuth.getUserByEmail(ADMIN_EMAIL);
      uid = existing.uid;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Super admin hasn't signed in via Google yet — store a pending record
        await adminDb.collection('super_admin_pending').doc(ADMIN_EMAIL).set({
          email: ADMIN_EMAIL,
          name: 'Super Admin',
          role: 'super_admin',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        }, { merge: true });
        console.log('[Seed] Super admin pending record written.');
        return;
      } else {
        throw err;
      }
    }

    if (uid) {
      await adminDb.collection('users').doc(uid).set({
        email: ADMIN_EMAIL,
        name: 'Super Admin',
        role: 'super_admin',
        businessId: null,
        branchId: null,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
      }, { merge: true });
      console.log('[Seed] Super admin Firestore record ensured.');
    }
  } catch (err) {
    console.error('[Seed] Super admin seeding failed:', err);
  }
}

// --- API ROUTES ---

// AI Proxy
app.post('/api/ai', async (req, res) => {
  const { prompt, model = 'gemini-1.5-flash' } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'AI API Key not configured' });
  }

  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const result = await genAI.models.generateContent({
      model,
      contents: prompt
    });
    res.json({ text: result.text });
  } catch (error: any) {
    console.error('AI Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Promotion for Super Admin
app.post('/api/auth/promote-if-super-admin', async (req, res) => {
  const { idToken } = req.body;
  if (!serviceAccount.project_id) return res.json({ promoted: false });

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decoded;

    if (email !== process.env.SUPER_ADMIN_EMAIL) {
      return res.json({ promoted: false });
    }

    await adminDb.collection('users').doc(uid).set({
      email,
      name: decoded.name || 'Super Admin',
      role: 'super_admin',
      businessId: null,
      branchId: null,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'system',
    }, { merge: true });

    await adminDb.collection('super_admin_pending').doc(email).delete().catch(() => {});
    res.json({ promoted: true });
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Check Invitations
app.post('/api/auth/check-invite', async (req, res) => {
  const { idToken } = req.body;
  if (!serviceAccount.project_id) return res.json({ invited: false });

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decoded;

    const inviteRef = adminDb.collection('users_invited').doc(email);
    const invite = await inviteRef.get();

    if (!invite.exists) return res.json({ invited: false });

    const data = invite.data()!;
    await adminDb.collection('users').doc(uid).set({
      email,
      name: decoded.name || data.name,
      role: data.role,
      businessId: data.businessId,
      branchId: data.branchId,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: data.invitedBy,
    }, { merge: true });

    await inviteRef.delete();
    res.json({ invited: true, role: data.role });
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// User Protection check
app.get('/api/admin/is-protected', async (req, res) => {
  const { uid } = req.query as { uid: string };
  if (!serviceAccount.project_id) return res.json({ protected: false });

  try {
    const user = await adminAuth.getUser(uid);
    res.json({ protected: user.email === process.env.SUPER_ADMIN_EMAIL });
  } catch {
    res.json({ protected: false });
  }
});

// Create User (Invite)
app.post('/api/admin/create-user', async (req, res) => {
  const { email, name, role, businessId, branchId, callerToken } = req.body;
  if (!serviceAccount.project_id) return res.status(500).json({ error: 'Firestore Admin not configured' });

  try {
    const decodedCaller = await adminAuth.verifyIdToken(callerToken);
    const callerRef = await adminDb.collection('users').doc(decodedCaller.uid).get();
    const caller = callerRef.data();

    if (!caller || (caller.role !== 'business_owner' && caller.role !== 'manager' && caller.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await adminDb.collection('users_invited').doc(email).set({
      email,
      name,
      role,
      businessId,
      branchId,
      invitedBy: decodedCaller.uid,
      invitedAt: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// --- VITE MIDDLEWARE ---

async function startServer() {
  if (serviceAccount.project_id) {
    await seedSuperAdmin();
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

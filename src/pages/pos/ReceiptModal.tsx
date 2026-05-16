import React from 'react';
import { useDocument } from '../../hooks/useFirestore';
import { Sale } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Printer, X, Download, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ReceiptModalProps {
  saleId: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ saleId, onClose }) => {
  const { data: sale, loading } = useDocument<Sale>('sales', saleId);
  const { userProfile } = useAuth();

  if (loading || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Receipt">
      <div className="p-8 bg-white text-slate-900 rounded-lg shadow-inner max-w-sm mx-auto font-mono text-sm print:p-0 print:shadow-none">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold uppercase tracking-tighter mb-1">Receipt</h2>
          <p className="text-xs uppercase opacity-70">Biashara Yako POS</p>
          <p className="text-[10px] mt-2 italic">{formatDate(sale.createdAt, 'PPpp')}</p>
        </div>

        <div className="border-y border-slate-200 border-dashed py-3 mb-4 flex justify-between text-[10px] uppercase font-bold text-slate-500">
          <span>Item</span>
          <div className="flex gap-6">
            <span>Qty</span>
            <span>Price</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {sale.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start gap-4">
              <span className="flex-1 uppercase text-xs">{item.name}</span>
              <div className="flex gap-6 shrink-0">
                <span>{item.quantity}</span>
                <span>{formatCurrency(item.subtotal).replace('KSh', '')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.total - sale.tax)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>VAT (16%)</span>
            <span>{formatCurrency(sale.tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-slate-100">
            <span>TOTAL</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
        </div>

        <div className="mt-8 text-center space-y-1">
          <p className="text-[10px] font-bold uppercase">Paid via {sale.paymentMethod}</p>
          <div className="flex justify-center py-4">
            {/* Simple Mock Barcode */}
            <div className="flex gap-0.5 h-8">
              {Array(20).fill(0).map((_, i) => (
                <div key={i} className={`bg-slate-900 ${Math.random() > 0.5 ? 'w-0.5' : 'w-1'}`}></div>
              ))}
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Thank you for your business!</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 print:hidden">
        <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button onClick={onClose} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-white rounded-xl font-bold border border-white/10">
          Done
        </button>
      </div>
    </Modal>
  );
};

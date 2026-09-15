import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Printer, Download, ArrowLeft, Check, X } from 'lucide-react';
import api from '../../config/axios';
import { Skeleton } from '../../components/ui/Skeleton';

const METHOD_LABEL = {
  cash:  'Naqd pul',
  click: 'Click',
  payme: 'Payme',
  bank:  'Bank o\'tkazma',
  other: 'Boshqa',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatSum(amount) {
  return Number(amount || 0).toLocaleString('uz-UZ') + ' so\'m';
}

export default function PaymentReceiptPage() {
  const { id: paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const printRef = useRef(null);

  // Accept ?studentId=&groupId=&month=&amount= for quick preview without DB lookup
  const previewData = searchParams.get('preview') === '1' ? {
    student: { name: searchParams.get('student') },
    group:   { name: searchParams.get('group') },
    month:   searchParams.get('month'),
    amount:  searchParams.get('amount'),
    method:  searchParams.get('method') || 'cash',
    paidAt:  searchParams.get('paidAt') || new Date().toISOString(),
    receiptNumber: searchParams.get('receipt') || '—',
  } : null;

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment-receipt', paymentId],
    queryFn: () => api.get(`/payments/${paymentId}`).then(r => r.data?.data),
    enabled: !!paymentId && !previewData,
  });

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data),
  });

  const data = previewData || payment;

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`kvitansiya-${data?.receiptNumber || paymentId}.pdf`);
    } catch {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 rounded" />)}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <div className="text-4xl mb-3">🧾</div>
        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>To'lov topilmadi</div>
        <button onClick={() => navigate(-1)} className="btn-ghost mt-4"><ArrowLeft size={14} /> Orqaga</button>
      </div>
    );
  }

  const centerName = settings?.centerName || 'Abdora AI Ta\'lim Markazi';
  const centerPhone = settings?.centerPhone || '';
  const centerAddress = settings?.centerAddress || '';
  const receiptHeader = settings?.receiptHeader || centerName;
  const receiptFooter = settings?.receiptFooter || 'Xizmatimizdan foydalanganingiz uchun rahmat!';
  const logo = settings?.centerLogo || '';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Action bar (hidden on print) */}
      <div className="no-print flex items-center justify-between px-6 py-3 sticky top-0 z-10"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <button onClick={() => navigate(-1)} className="btn-ghost">
          <ArrowLeft size={15} /> Orqaga
        </button>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-outline">
            <Printer size={15} /> Chop etish
          </button>
          <button onClick={handlePDF} className="btn-primary">
            <Download size={15} /> PDF saqlash
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div className="flex-1 flex items-start justify-center p-6">
        <motion.div
          ref={printRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white shadow-lg"
          style={{
            borderRadius: 16,
            border: '1px solid #E5E7EB',
            fontFamily: "'DM Sans', sans-serif",
            color: '#111827',
          }}
        >
          {/* Header */}
          <div className="text-center px-8 pt-8 pb-6 border-b border-gray-100">
            {logo && (
              <img src={logo} alt="Logo" className="h-12 mx-auto mb-3 object-contain" />
            )}
            <div className="font-bold text-xl mb-1" style={{ color: '#F06413' }}>
              {receiptHeader}
            </div>
            {centerAddress && (
              <div className="text-xs text-gray-500 mt-1">{centerAddress}</div>
            )}
            {centerPhone && (
              <div className="text-xs text-gray-500">{centerPhone}</div>
            )}
          </div>

          {/* Receipt title */}
          <div className="text-center py-4 border-b border-dashed border-gray-200">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200">
              <Check size={14} className="text-green-600" />
              <span className="font-semibold text-sm text-green-700">To'lov tasdiqlandi</span>
            </div>
          </div>

          {/* Receipt details */}
          <div className="px-8 py-6 space-y-0">
            {[
              { label: 'Chek raqami',    value: '#' + (data.receiptNumber || data.id?.slice(-6) || '—') },
              { label: 'Sana',           value: formatDate(data.paidAt || data.createdAt) },
              { label: 'Talaba',         value: data.student?.name || data.studentName || '—' },
              { label: 'Guruh',          value: data.group?.name  || data.groupName  || '—' },
              { label: 'Oy',             value: data.month ? new Date(data.month + '-01').toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' }) : '—' },
              { label: 'To\'lov usuli', value: METHOD_LABEL[data.method] || data.method || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-900">{value}</span>
              </div>
            ))}

            {/* Amount — big */}
            <div className="py-5 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Jami to'langan</span>
                <span className="text-2xl font-bold" style={{ color: '#F06413' }}>
                  {formatSum(data.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Barcode placeholder */}
          <div className="border-t border-dashed border-gray-200 px-8 py-5 text-center">
            <div className="text-xs text-gray-400 mb-3">{receiptFooter}</div>
            <div className="inline-flex gap-0.5">
              {Array.from({ length: 40 }, (_, i) => (
                <div key={i} className="bg-gray-800"
                  style={{ width: i % 3 === 0 ? 3 : 1.5, height: 36, borderRadius: 1 }} />
              ))}
            </div>
            <div className="text-[10px] text-gray-400 mt-2 font-mono">
              {data.id || data.receiptNumber || '—'}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

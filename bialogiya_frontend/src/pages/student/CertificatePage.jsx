import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Award, Share2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import PageHeader from '../../components/ui/PageHeader';

export default function CertificatePage() {
  const { user } = useAuthStore();
  const printRef = useRef(null);

  // Hardcoded for demo - ideally fetched from API
  const certificate = {
    id: 'CERT-2026-9874',
    courseName: 'Full-Stack Web Dasturlash',
    studentName: user?.name || 'Talaba',
    issueDate: new Date().toISOString(),
    score: 95,
  };

  const handleDownload = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      // A4 landscape
      const pdf = new jsPDF('l', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`sertifikat-${certificate.studentName.replace(/\s+/g, '-')}.pdf`);
    } catch {
      window.print();
    }
  };

  return (
    <div className="dashboard-shell max-w-4xl">
      <PageHeader
        title="Mening Sertifikatlarim"
        subtitle="Kursni muvaffaqiyatli tamomlaganingizni tasdiqlovchi hujjatlar"
      />

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Certificate Display */}
        <div className="flex-1 w-full overflow-hidden rounded-xl border shadow-sm bg-white" style={{ borderColor: 'var(--border)' }}>
          <motion.div
            ref={printRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full aspect-[1.414/1] bg-white p-8 md:p-12 flex flex-col items-center justify-center text-center"
            style={{ fontFamily: "'Playfair Display', serif", color: '#111827', background: 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%)' }}
          >
            {/* Border decorations */}
            <div className="absolute inset-4 border-4 border-double" style={{ borderColor: 'var(--primary)' }}></div>
            <div className="absolute inset-6 border" style={{ borderColor: 'var(--primary)', opacity: 0.2 }}></div>

            <Award size={48} className="mb-4" style={{ color: 'var(--primary)' }} />
            
            <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-wide uppercase" style={{ color: 'var(--primary)' }}>
              Sertifikat
            </h1>
            <p className="text-sm md:text-base text-gray-500 mb-8 italic">
              Ushbu sertifikat quyidagi shaxsga beriladi:
            </p>

            <h2 className="text-2xl md:text-4xl font-bold mb-6 border-b border-gray-300 pb-2 px-8">
              {certificate.studentName}
            </h2>

            <p className="text-sm md:text-base text-gray-600 max-w-lg mx-auto mb-8 leading-relaxed">
              <strong>{certificate.courseName}</strong> kursini muvaffaqiyatli yakunlagani 
              va yakuniy imtihonlardan {certificate.score}% natija ko'rsatgani uchun.
            </p>

            <div className="flex justify-between w-full max-w-md mt-auto pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-sm font-bold mb-1">{new Date(certificate.issueDate).toLocaleDateString('uz-UZ')}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">Sana</div>
              </div>
              <div className="text-center">
                <div className="w-24 h-6 mx-auto mb-1 border-b border-gray-800" style={{ backgroundImage: 'url("/signature.png")', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}></div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">Direktor</div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 text-[10px] text-gray-400 font-mono">
              ID: {certificate.id}
            </div>
          </motion.div>
        </div>

        {/* Actions Sidebar */}
        <div className="w-full md:w-64 space-y-3 flex-shrink-0">
          <div className="panel-card space-y-3">
            <h3 className="font-semibold text-sm mb-2">Harakatlar</h3>
            <button onClick={handleDownload} className="btn-primary w-full justify-center">
              <Download size={15} /> PDF yuklab olish
            </button>
            <button className="btn-outline w-full justify-center">
              <Share2 size={15} /> Ulashish
            </button>
          </div>
          
          <div className="panel-card text-xs" style={{ color: 'var(--text-secondary)' }}>
            <p className="mb-2"><strong>ID:</strong> {certificate.id}</p>
            <p className="mb-2"><strong>Kurs:</strong> {certificate.courseName}</p>
            <p><strong>Baho:</strong> {certificate.score}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

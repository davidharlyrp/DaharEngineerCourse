import { useRef, useState, useEffect, forwardRef } from 'react';
import { X, Download, Award, Loader2 } from 'lucide-react';
import type { Course, User } from '../types';
import { usePocketBase } from '../contexts/PocketBaseContext';
import { cn } from '../lib/utils';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  user: User;
  completedAt: string;
  progressId?: string;
  certificate?: string;
}

const CertificateContent = forwardRef<HTMLDivElement, {
  user: User;
  course: Course;
  completedAt: string;
  certificateId: string;
  formatDate: (d: string) => string;
}>(({ user, course, completedAt, certificateId, formatDate }, ref) => (
  <div
    ref={ref}
    className="bg-white text-[#1a1a1a] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-12"
    style={{ width: '1000px', height: '707px' }}
  >
    {/* Decorative Border */}
    <div className="absolute inset-8 border-[3px] border-[#2c3e50]/20 rounded-2xl pointer-events-none"></div>
    <div className="absolute inset-10 border border-[#2c3e50]/10 rounded-xl pointer-events-none"></div>

    {/* Content Overlay */}
    <div className="relative z-10 text-center w-full max-w-[900px] flex flex-col items-center h-full justify-between py-4">

      {/* Top Header Group */}
      <div className="flex flex-col items-center w-full mt-2">
        {/* Header Logo */}
        <div className="flex items-center justify-center mb-10 gap-2">
          <img src="/logo.png" className="w-[32px] h-[32px] opacity-90" alt="Logo" />
          <h2 className="text-xl font-bold tracking-widest text-[#2c3e50] uppercase">Dahar Engineer</h2>
        </div>

        {/* Sertifikat Title */}
        <div className="w-full">
          <h3 className="text-[64px] font-black tracking-[0.1em] mb-2 uppercase italic leading-none text-[#2c3e50]">
            SERTIFIKAT
          </h3>
          <div className="flex items-center justify-center gap-6 w-full mx-auto">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#2c3e50] to-transparent"></div>
            <span className="text-[18px] font-light tracking-[0.4em] uppercase text-[#2c3e50]">PENGHARGAAN</span>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#2c3e50] to-transparent"></div>
          </div>
        </div>

        {/* Certificate ID */}
        <p className="text-[14px] font-medium text-[#2c3e50]/80 mb-2">
          No. : {certificateId}
        </p>
      </div>

      {/* Recipient */}
      <div className="text-center w-full">
        <p className="text-[18px] text-[#2c3e50] mb-1">Diberikan secara bangga kepada:</p>
        <h4 className="text-[56px] font-bold font-serif italic py-2 leading-tight text-[#2c3e50]">
          {user.name}
        </h4>
        <div className="w-[400px] h-[1px] bg-[#2c3e50] mx-auto mt-2 opacity-30"></div>
      </div>

      {/* Course Details */}
      <div className="text-center px-12 mt-1 w-full">
        <p className="text-[16px] max-w-[600px] mx-auto leading-relaxed text-[#2c3e50]">
          Atas partisipasi aktif dan pencapaiannya dalam menyelesaikan program kursus:
        </p>
        <h5 className="text-[24px] font-bold mt-2 text-[#2c3e50] underline decoration-[#2c3e50]/30 underline-offset-4">
          {course.title}
        </h5>
        <p className="text-[16px] text-[#2c3e50] mt-2">
          Diselesaikan pada tanggal : {formatDate(completedAt)}
        </p>
      </div>

      {/* Signature Area */}
      <div className="w-full flex justify-between items-end px-4 mt-auto mb-4">
        {/* Left Space (Can be used for QR code or Badge later) */}
        <div className="w-[200px]"></div>

        {/* Signature Right */}
        <div className="w-[250px] text-center">
          {/* Placeholder for Signature Image if any */}
          <div className="h-20 mb-2 border-b border-[#2c3e50] flex items-end justify-center pb-2">
            {/* You can place a signature image here later */}
          </div>
          <p className="text-[14px] font-bold text-[#2c3e50]">David Harly Rizky Prabudhi, S.T.</p>
          <p className="text-[10px] text-[#2c3e50]">Director of PT. Dahar Engineer Consultant</p>
        </div>
      </div>
    </div>
  </div>
));

export function CertificateModal({
  isOpen,
  onClose,
  course,
  user,
  completedAt,
  progressId,
  certificate,
}: CertificateModalProps) {
  const { pb } = usePocketBase();
  const [isGenerating, setIsGenerating] = useState(false);
  const [completionCount, setCompletionCount] = useState<number | null>(null);

  // Fetch completion count for this course to generate certificate number
  useEffect(() => {
    if (isOpen && course?.id && completionCount === null) {
      const fetchCount = async () => {
        try {
          const result = await pb.collection('online_course_progress').getList(1, 1, {
            filter: `courseId = "${course.id}" && completedAt != null`,
            requestKey: null,
          });
          setCompletionCount(result.totalItems || 1);
        } catch (error) {
          console.error('Error fetching completion count:', error);
          setCompletionCount(1);
        }
      };
      fetchCount();
    }
  }, [isOpen, course?.id, pb, completionCount]);

  if (!isOpen) return null;

  const getCertificateId = () => {
    const year = new Date(completedAt).getFullYear();
    const prefix = course.id.slice(0, 3).toUpperCase();
    const sequence = String(completionCount || 1).padStart(4, '0');
    return `/DE/${year}/${prefix}/${sequence}`;
  };

  const handleDownloadPDF = async () => {
    // 1. If certificate already exists in PocketBase, just open it
    if (certificate && progressId) {
      const fileUrl = pb.files.getUrl({ id: progressId, collectionId: 'online_course_progress', certificate }, certificate);
      window.open(fileUrl, '_blank');
      return;
    }

    // 2. Otherwise generate via API and upload
    if (!progressId) return;

    try {
      setIsGenerating(true);

      // Call the FastAPI backend to generate and sign the PDF
      const response = await fetch('http://localhost:8000/generate-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: user.name,
          courseTitle: course.title,
          completedAt: completedAt,
          certificateId: getCertificateId()
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }

      // The API returns the raw PDF bytes
      const pdfBlob = await response.blob();

      const fileName = `Certificate-${course.title.replace(/\s+/g, '-')}-${user.name.replace(/\s+/g, '-')}.pdf`;

      // Upload to PocketBase
      const formData = new FormData();
      formData.append('certificate', pdfBlob, fileName);

      await pb.collection('online_course_progress').update(progressId, formData);

      // Trigger download for the user
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error) {
      console.error('Error generating/uploading signed PDF via API:', error);
      alert('Failed to generate secure certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Selesai';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0a0a]/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col bg-dark-900 border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-army-500/10 rounded-2xl flex items-center justify-center border border-army-500/20">
              <Award className="w-6 h-6 text-army-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Your Certificate</h2>
              <p className="text-sm text-muted-foreground">Congratulations on completing the course!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8 scrollbar-thin">
          {/* Certificate Preview Wrapper - handles scaling for UI */}
          <div className="relative mx-auto bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
            <div
              style={{
                transform: 'scale(var(--preview-scale))',
                transformOrigin: 'center center',
                width: '1000px',
                height: '707px'
              }}
              className="transition-transform duration-500"
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  :root { --preview-scale: 0.8; }
                  @media (max-width: 1100px) { :root { --preview-scale: 0.7; } }
                  @media (max-width: 900px) { :root { --preview-scale: 0.55; } }
                  @media (max-width: 768px) { :root { --preview-scale: 0.45; } }
                  @media (max-width: 640px) { :root { --preview-scale: 0.35; } }
                  @media (max-width: 480px) { :root { --preview-scale: 0.28; } }
              `}} />

              {/* Displayed Preview (No Ref, inside scaled wrapper) */}
              <CertificateContent
                user={user}
                course={course}
                completedAt={completedAt}
                certificateId={getCertificateId()}
                formatDate={formatDate}
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-8 border-t border-white/5 bg-dark-950/50 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className={cn(
              "flex items-center justify-center gap-3 px-10 py-4 bg-army-500 text-secondary rounded-2xl font-bold transition-all duration-300 w-full sm:w-auto",
              "shadow-xl shadow-army-500/20 hover:shadow-army-500/40 hover:-translate-y-1",
              isGenerating && "opacity-70 cursor-not-allowed translate-y-0"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Unduh Sertifikat (PDF)
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-10 py-4 bg-white/5 text-white rounded-2xl font-bold border border-white/10 hover:bg-white/10 transition-all w-full sm:w-auto"
          >
            Mungkin Nanti
          </button>
        </div>

        {/* Appreciation Footer */}
        <div className="px-8 py-6 bg-army-500/5 text-center">
          <p className="text-muted-foreground text-xs italic">
            Sertifikat ini diakui secara resmi oleh Dahar Engineer Consultant sebagai bukti kompetensi Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

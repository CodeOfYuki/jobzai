import { useState, useEffect } from 'react';
import { Upload, FileText, RefreshCw, Loader2 } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface CVSelectionProps {
  onFileSelect: (file: File | null) => void;
  onExistingCVSelect: (cvUrl: string) => void;
}

export default function CVSelection({ onFileSelect, onExistingCVSelect }: CVSelectionProps) {
  const { currentUser } = useAuth();
  const [existingCV, setExistingCV] = useState<{ url: string; name: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new' | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.cvUrl && data.cvName) {
            setExistingCV({ url: data.cvUrl, name: data.cvName });
            setSelectedOption('existing');
          }
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('CV must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    try {
      setIsUploading(true);
      setNewFile(file);

      // Upload to Firebase Storage with user-specific path
      const cvRef = ref(storage, `cvs/${currentUser.uid}/${file.name}`);
      await uploadBytes(cvRef, file);
      const downloadUrl = await getDownloadURL(cvRef);

      // Update user document with CV info
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        cvUrl: downloadUrl,
        cvName: file.name,
        lastUpdated: new Date().toISOString()
      });

      onFileSelect(file);
      onExistingCVSelect(downloadUrl);
      toast.success('CV uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading CV:', error);
      if (error.code === 'storage/unauthorized') {
        toast.error('Permission denied. Please try again or contact support.');
      } else {
        toast.error('Failed to upload CV. Please try again.');
      }
      setNewFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOptionChange = (option: 'existing' | 'new') => {
    setSelectedOption(option);
    if (option === 'existing' && existingCV) {
      onExistingCVSelect(existingCV.url);
      onFileSelect(null);
    } else {
      onExistingCVSelect('');
    }
  };

  if (!existingCV) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload CV/Resume
        </label>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 mb-3 text-gray-400 animate-spin" />
                  <p className="text-sm text-gray-500">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF or Word (MAX. 5MB)</p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">CV/Resume</label>
      
      <div className="space-y-4">
        {/* Existing CV Option */}
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            id="existing-cv"
            checked={selectedOption === 'existing'}
            onChange={() => handleOptionChange('existing')}
            className="h-4 w-4 text-[#6956A8] focus:ring-[#6956A8]"
          />
          <label htmlFor="existing-cv" className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-900">
              <FileText className="h-5 w-5 text-gray-400" />
              <span>Use existing CV:</span>
              <span className="font-medium">{existingCV.name}</span>
            </div>
          </label>
        </div>

        {/* Upload New CV Option */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="new-cv"
              checked={selectedOption === 'new'}
              onChange={() => handleOptionChange('new')}
              className="h-4 w-4 text-[#6956A8] focus:ring-[#6956A8]"
            />
            <label htmlFor="new-cv" className="text-sm text-gray-900">
              Upload a new CV
            </label>
          </div>

          {selectedOption === 'new' && (
            <div className="ml-7">
              <label className="flex flex-col w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 mb-3 text-gray-400 animate-spin" />
                      <p className="text-sm text-gray-500">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF or Word (MAX. 5MB)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              {newFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected file: {newFile.name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
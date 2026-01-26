import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { chatbotAPI } from '../services/api';
import { chatbotConfig } from '../config/chatbotConfig';
import { cn } from '../utils/cn';

export function ComplaintForm({
  onClose,
  onSuccess,
  userInfo,
  conversationId,
  sessionId
}) {
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintImages, setComplaintImages] = useState([]);
  const [complaintImagePreviews, setComplaintImagePreviews] = useState([]);
  const [isTransactionRelated, setIsTransactionRelated] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const complaintFileInputRef = useRef(null);

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_IMAGES = chatbotConfig.imageUpload.maxImages;
    const currentImageCount = complaintImages.length;

    if (currentImageCount >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`);
      if (complaintFileInputRef.current) {
        complaintFileInputRef.current.value = '';
      }
      return;
    }

    const remainingSlots = MAX_IMAGES - currentImageCount;
    const validFiles = [];
    const fileValidationErrors = [];

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];

      if (!chatbotConfig.imageUpload.allowedTypes.includes(file.type.toLowerCase())) {
        fileValidationErrors.push(`Invalid file type for "${file.name}".`);
        continue;
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !chatbotConfig.imageUpload.allowedExtensions.includes(fileExtension)) {
        fileValidationErrors.push(`Invalid file extension for "${file.name}".`);
        continue;
      }

      if (file.size > chatbotConfig.imageUpload.maxSize) {
        fileValidationErrors.push(`Image "${file.name}" is too large. Maximum size is 5MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (fileValidationErrors.length > 0) {
      setError(fileValidationErrors[0]);
    } else {
      setError('');
    }

    if (validFiles.length === 0) {
      if (complaintFileInputRef.current) {
        complaintFileInputRef.current.value = '';
      }
      return;
    }

    // Create previews
    const previewPromises = validFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    try {
      const previews = await Promise.all(previewPromises);
      setComplaintImages(prev => [...prev, ...validFiles]);
      setComplaintImagePreviews(prev => [...prev, ...previews]);

      if (complaintFileInputRef.current) {
        complaintFileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error creating image previews:', error);
      setError('Failed to create image previews. Please try again.');
    }
  };

  const removeImage = (index) => {
    setComplaintImages(prev => prev.filter((_, i) => i !== index));
    setComplaintImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setComplaintImages([]);
    setComplaintImagePreviews([]);
    if (complaintFileInputRef.current) {
      complaintFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!complaintTitle.trim() || !complaintDescription.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isTransactionRelated && !transactionHash.trim()) {
      setError('Please provide transaction hash for transaction-related issues.');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrls = [];

      if (complaintImages.length > 0) {
        const uploadResult = await chatbotAPI.uploadImage(complaintImages);
        if (uploadResult.success) {
          if (uploadResult.data?.imageUrls) {
            imageUrls = uploadResult.data.imageUrls;
          } else if (uploadResult.data?.imageUrl) {
            imageUrls = [uploadResult.data.imageUrl];
          }
        } else {
          throw new Error(uploadResult.error || 'Failed to upload images');
        }
      }

      const complaintData = {
        complaint_title: complaintTitle.trim(),
        complaint_description: complaintDescription.trim(),
        is_transaction_related: isTransactionRelated,
        transaction_hash: isTransactionRelated ? transactionHash.trim() : null,
        complaint_image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      };

      const response = await chatbotAPI.submitComplaint(complaintData);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
        onClose();
      } else {
        throw new Error(response.error || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setError(error.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Submit Complaint</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <Label htmlFor="complaint-title" className="text-white">
                Complaint Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="complaint-title"
                value={complaintTitle}
                onChange={(e) => setComplaintTitle(e.target.value)}
                placeholder="Enter complaint title"
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="complaint-description" className="text-white">
                Description <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="complaint-description"
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={5}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-white">Transaction Related</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="transaction-related"
                  checked={isTransactionRelated}
                  onChange={(e) => setIsTransactionRelated(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4"
                />
                <Label htmlFor="transaction-related" className="text-sm font-normal">
                  This complaint is related to a transaction
                </Label>
              </div>
            </div>

            {isTransactionRelated && (
              <div>
                <Label htmlFor="transaction-hash" className="text-white">
                  Transaction Hash <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="transaction-hash"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  placeholder="Enter transaction hash (0x...)"
                  disabled={isSubmitting}
                  className="mt-1 font-mono text-xs"
                />
              </div>
            )}

            <div>
              <Label className="text-white">Attach Images (Optional)</Label>
              {complaintImagePreviews.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {complaintImagePreviews.length}/{chatbotConfig.imageUpload.maxImages} images
                </p>
              )}
              <input
                type="file"
                ref={complaintFileInputRef}
                accept="image/jpeg,image/jpg,image/png,image/gif"
                multiple
                onChange={handleImageSelect}
                disabled={isSubmitting || complaintImagePreviews.length >= chatbotConfig.imageUpload.maxImages}
                className="hidden"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {complaintImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-emerald-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {complaintImagePreviews.length < chatbotConfig.imageUpload.maxImages && (
                  <button
                    type="button"
                    onClick={() => complaintFileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="w-20 h-20 border-2 border-dashed border-emerald-500/30 rounded-lg flex items-center justify-center hover:border-emerald-500/50 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-emerald-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  setComplaintTitle('');
                  setComplaintDescription('');
                  clearAllImages();
                  setError('');
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


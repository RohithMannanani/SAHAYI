import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, X, Upload } from 'lucide-react';
import './ProfileImageUpload.css';

// Helper function to create the cropped image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      blob.name = 'cropped.jpeg';
      resolve(blob);
    }, 'image/jpeg');
  });
};

const ProfileImageUpload = ({ currentAvatarUrl, onAvatarUpload, userName = 'User' }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append('avatarFile', croppedImage, 'avatar.jpg');
      
      await onAvatarUpload(formData);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0C382E&color=fff&size=200`;
  const displayAvatar = currentAvatarUrl || defaultAvatar;

  return (
    <div className="profile-image-upload-wrapper">
      <div className="avatar-display">
        <img src={displayAvatar} alt="Profile" className="profile-large-avatar" />
        <label className="avatar-edit-badge" title="Change Profile Picture">
          <Camera size={14} />
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden-file-input"
          />
        </label>
      </div>

      {imageSrc && (
        <div className="cropper-modal-overlay">
          <div className="cropper-modal">
            <div className="cropper-header">
              <h3>Adjust Profile Picture</h3>
              <button className="close-btn" onClick={() => setImageSrc(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="cropper-container">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="cropper-controls">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="zoom-slider"
              />
            </div>
            <div className="cropper-footer">
              <button className="cancel-btn" onClick={() => setImageSrc(null)}>Cancel</button>
              <button 
                className="upload-btn" 
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Save Picture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;

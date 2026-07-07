'use client'

import { useState, useRef } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Modal } from './ui/modal'
import { Button } from './ui/button'

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  onCropComplete: (croppedImage: Blob) => void
  onSkipCrop: (originalFile: File) => void
  originalFile: File
}

export function ImageCropModal({ isOpen, onClose, imageSrc, onCropComplete, onSkipCrop, originalFile }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)

  const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width
    canvas.height = crop.height

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        }
      }, 'image/png')
    })
  }

  const handleCropComplete = async () => {
    if (completedCrop && imgRef.current) {
      try {
        const croppedImage = await getCroppedImg(imgRef.current, completedCrop)
        onCropComplete(croppedImage)
        onClose()
      } catch (error) {
        console.error('Error cropping image:', error)
      }
    }
  }


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crop & Edit Photo">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="max-w-full">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imageSrc}
                className="max-w-full max-h-96 object-contain"
              />
            </ReactCrop>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onSkipCrop(originalFile)}>
            Skip Crop
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete}>
            Apply Crop
          </Button>
        </div>
      </div>
    </Modal>
  )
}

"use client"

import { useRef } from 'react';
import { Cropper, ReactCropperElement } from 'react-cropper';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import 'cropperjs/dist/cropper.css'


interface CropImageDialogProps {
    src: string;
    cropAspectRatio: number;
    onCropped: (blob: Blob | null) => void;
    onClose: () => void;
}

export default function CropImageDialog({
    src,
    cropAspectRatio,
    onCropped,
    onClose,
}: CropImageDialogProps) {
    // Create a ref for the cropper instance
    const cropperRef = useRef<ReactCropperElement>(null);

    function crop() {
        // Get the cropper instance
        const cropper = cropperRef.current?.cropper;

        // If the cropper instance is not available, return
        if (!cropper) return;

        // Convert the cropped canvas to a blob and call the onCropped callback with the blob and the image type "image/webp". "image/webp" is a lossy image format that supports transparency and animation
        cropper.getCroppedCanvas().toBlob((blob) => onCropped(blob), "image/webp");
        onClose();
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Crop Image
                    </DialogTitle>
                </DialogHeader>
                <Cropper
                    src={src}
                    aspectRatio={cropAspectRatio}
                    guides={false}
                    zoomable={false}
                    ref={cropperRef}
                    className="mx-auto size-fit"
                />
                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={crop}>Crop</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
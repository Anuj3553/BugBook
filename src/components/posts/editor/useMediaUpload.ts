import { useToast } from "@/hooks/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";

export interface Attachment {
    file: File;
    mediaId?: string;
    isUploading: boolean;
}

// Hook to handle media uploads
export default function useMediaUpload() {
    const { toast } = useToast();

    const [attachments, setAttachments] = useState<Attachment[]>([]);

    const [uploadProgress, setUploadProgress] = useState<number>();

    // Upload attachments
    const { startUpload, isUploading } = useUploadThing("attachment", {
        // Rename files to prevent conflicts
        onBeforeUploadBegin(files) {
            const renamedFiles = files.map((file) => {
                // Generate a random UUID to prevent conflicts
                const extension = file.name.split(".").pop();
                return new File(
                    [file], // File data
                    `attachment_${crypto.randomUUID()}.${extension}`, // Rename the file
                    {
                        type: file.type, // Preserve the file type
                    },
                );
            });

            setAttachments((prev) => [
                ...prev, // Add the renamed files to the list of attachments
                ...renamedFiles.map((file) => ({ file, isUploading: true })), // Mark the files as uploading
            ]);

            // Return the renamed files
            return renamedFiles;
        },
        // Update the upload progress
        onUploadProgress: setUploadProgress,
        // Update the media ID of the uploaded file
        onClientUploadComplete(res) {
            setAttachments((prev) =>
                prev.map((a) => {
                    // We added a random UUID to the file name so we need to find the correct upload result
                    const uploadResult = res.find((r) => r.name === a.file.name);

                    // If the upload result is not found, return the attachment as is
                    if (!uploadResult) return a;

                    // Update the media ID of the attachment
                    return {
                        ...a, // Spread the attachment to keep the other properties
                        mediaId: uploadResult.serverData.mediaId, // Update the media ID
                        isUploading: false, // Mark the file as not uploading
                    };
                }),
            );
        },
        // Handle upload errors
        onUploadError(e) {
            // Remove the files that failed to upload
            setAttachments((prev) => prev.filter((a) => !a.isUploading));
            toast({
                variant: "destructive",
                description: e.message,
            });
        },
    });

    // Handle the start upload event
    function handleStartUpload(files: File[]) {
        // Prevent multiple uploads
        if (isUploading) {
            toast({
                variant: "destructive",
                description: "Please wait for the current upload to finish.",
            });
            return;
        }

        // Limit the number of attachments
        if (attachments.length + files.length > 5) {
            toast({
                variant: "destructive",
                description: "You can only upload up to 5 attachments per post.",
            });
            return;
        }

        // Start the upload
        startUpload(files);
    }

    // Remove an attachment
    function removeAttachment(fileName: string) {
        setAttachments((prev) => prev.filter((a) => a.file.name !== fileName));
    }

    // Reset the attachments
    function reset() {
        setAttachments([]);
        setUploadProgress(undefined);
    }

    // Expose the functions and state
    return {
        startUpload: handleStartUpload,
        attachments,
        isUploading,
        uploadProgress,
        removeAttachment,
        reset,
    };
}
"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { UserData } from "@/lib/types";
import { updateUserProfileSchema, UpdateUserProfileValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { useUpdateProfileMutation } from "./mutations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LoadingButton from "@/components/LoadingButton";
import Image, { StaticImageData } from "next/image";
import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import { Camera } from "lucide-react";
import CropImageDialog from "@/components/ui/CropImageDialog";
import Resizer from "react-image-file-resizer";

interface EditProfileButtonProps {
    user: UserData;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditProfileDailog({
    user,
    open,
    onOpenChange
}: EditProfileButtonProps) {
    const form = useForm<UpdateUserProfileValues>({
        resolver: zodResolver(updateUserProfileSchema), // zodResolver is a function that creates a resolver for a zod schema and returns it as a hookform resolver object 
        defaultValues: { // defaultValues is an object that contains the default values for the form
            displayName: user.displayName,
            bio: user.bio || "",
        }
    })

    const mutation = useUpdateProfileMutation();

    const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);

    async function onSubmit(values: UpdateUserProfileValues) {
        // Create a new file object with the cropped avatar blob
        const newAvatarFile = croppedAvatar
            ? new File([croppedAvatar], `avatar_${user.id}.webp`) // create a new file object with the cropped avatar blob
            : undefined

        mutation.mutate(
            {
                values, // values is an object that contains the form values
                avatar: newAvatarFile // avatar is a file object that contains the new avatar file
            },
            {
                onSuccess: () => {
                    setCroppedAvatar(null); // Reset the cropped avatar state
                    onOpenChange(false); // Close the dialog
                }
            }
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-1.5">
                    <Label>Avatar</Label>
                    <AvatarInput
                        src={croppedAvatar
                            ? URL.createObjectURL(croppedAvatar) // createObjectURL is a function that creates a URL for a blob object
                            : user.avatarUrl || avatarPlaceholder
                        }
                        onImageCropped={setCroppedAvatar}
                    />
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => ( // render is a function that takes a field object and returns a JSX element
                                <FormItem>
                                    <FormLabel>Display name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your display name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => ( // render is a function that takes a field object and returns a JSX element
                                <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us little bit about yourself"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <LoadingButton type="submit" loading={mutation.isPending}>
                                Save
                            </LoadingButton>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

interface AvatarInputProps {
    src: string | StaticImageData;
    onImageCropped: (blob: Blob | null) => void;
}

function AvatarInput({ src, onImageCropped }: AvatarInputProps) {
    const [imageToCrop, setImageToCrop] = useState<File>();

    const fileInputRef = useRef<HTMLInputElement>(null);

    function onImageSelected(image: File | undefined) {
        if (!image) return;

        Resizer.imageFileResizer(
            image, // image is a file object
            1024, // maxWidth is a number that represents the maximum width of the image
            1024, // maxHeight is a number that represents the maximum height of the image
            "WEBP", // format is a string that represents the format of the image
            100, // quality is a number that represents the quality of the image
            0, // rotation is a number that represents the rotation of the image
            // uri is a function that takes a string, blob, file, or progress event and returns void
            (uri: string | Blob | File | ProgressEvent<FileReader>) => {
                setImageToCrop(uri as File) // set the image to crop state to the uri
            },
            "file", // outputType is a string that represents the output type of the image
        )
    }

    return (
        <>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => onImageSelected(e.target.files?.[0])}
                ref={fileInputRef}
                className="hidden sr-only"
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative block"
            >
                <Image
                    src={src}
                    alt="Avatar preview"
                    width={150}
                    height={150}
                    className="size-32 flex-none rounded-full object-cover"
                />
                <span className="absolute inset-0 m-auto hidden group-hover:flex size-12 items-center justify-center rounded-full bg-black bg-opacity-30 text-white transition-colors duration-200">
                    <Camera size={24} />
                </span>
            </button>
            {imageToCrop && (
                <CropImageDialog
                    src={URL.createObjectURL(imageToCrop)} // createObjectURL is a function that creates a URL for a blob object
                    cropAspectRatio={1} // cropAspectRatio is a number that represents the aspect ratio of the crop area
                    onCropped={onImageCropped} // onCropped is a function that takes a blob object and returns void
                    onClose={() => {
                        setImageToCrop(undefined); // Reset the image to crop state
                        // Reset the file input value to allow selecting the same file again
                        if (fileInputRef.current) {
                            fileInputRef.current.value = ""; // Reset the file input value to allow selecting the same file again
                        }
                    }}
                />
            )}
        </>
    )
}

"use client";

import { ChangeEvent, useRef, useState } from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// ShadCn components
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

// Components
import { BaseButton } from "@/app/components";

// Icons
import { ImageMinus, Image } from "lucide-react";

// Types
import { NameType } from "@/types";

type FormFileProps = {
    name: NameType;
    label?: string;
    placeholder?: string;
};

const FormFile = ({ name, label, placeholder }: FormFileProps) => {
    const { control, setValue } = useFormContext();

    const logoImage = useWatch({
        name: name,
        control,
    });

    const [base64Image, setBase64Image] = useState<string>(logoImage ?? "");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files![0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target!.result as string;
                setBase64Image(base64String);
                setValue(name, base64String); // Set the value for form submission
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setBase64Image("");
        setValue(name, "");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <FormField
                control={control}
                name={name}
                render={() => (
                    <FormItem className="w-full min-w-0">
                        <Label>{label}:</Label>
                        {base64Image ? (
                            <img
                                id="logoImage"
                                src={base64Image}
                                alt={label ?? "Invoice logo"}
                                className="h-[7rem] w-full max-w-[10rem] object-contain"
                            />
                        ) : (
                            <div className="w-full max-w-[10rem]">
                                <Label
                                    htmlFor={name}
                                    className="flex h-[7rem] w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                                >
                                    <>
                                        <div className="flex flex-col items-center gap-1 px-2 text-center">
                                            <Image
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                            />
                                            <p className="text-xs">
                                                {placeholder}
                                            </p>
                                        </div>
                                        <FormControl>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                id={name}
                                                className="hidden"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </>
                                </Label>
                            </div>
                        )}
                    </FormItem>
                )}
            />
            {base64Image && (
                <div className="mt-2">
                    <BaseButton
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={removeLogo}
                    >
                        <ImageMinus className="h-4 w-4" />
                        Remove logo
                    </BaseButton>
                </div>
            )}
        </>
    );
};

export default FormFile;

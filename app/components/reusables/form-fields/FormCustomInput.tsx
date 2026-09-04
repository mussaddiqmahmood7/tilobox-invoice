// Components
import { BaseButton, FormInput } from "@/app/components";

// Icons
import { Trash2 } from "lucide-react";

type FormCustomInputProps = {
    index: number;
    location: string;
    removeField: (index: number) => void;
};

const FormCustomInput = ({
    index,
    location,
    removeField,
}: FormCustomInputProps) => {
    const nameKey = `${location}[${index}].key`;
    const nameValue = `${location}[${index}].value`;
    return (
        <>
            <div className="flex items-start gap-2">
                <div className="w-[38%] min-w-0 @xl:w-[8rem]">
                    <FormInput
                        name={nameKey}
                        placeholder="Name"
                        vertical
                        className="h-9 border-none p-0 font-medium"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <FormInput name={nameValue} placeholder="Value" vertical />
                </div>

                <BaseButton
                    size="icon"
                    variant="ghost"
                    aria-label="Remove field"
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeField(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </BaseButton>
            </div>
        </>
    );
};

export default FormCustomInput;

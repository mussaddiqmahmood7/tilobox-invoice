"use client";

import { useEffect } from "react";

// RHF
import { FieldArrayWithId, useFormContext, useWatch } from "react-hook-form";

// DnD
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ShadCn
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Components
import { BaseButton, FormInput, FormTextarea } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Utils
import { cn } from "@/lib/utils";

// Icons
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";

// Types
import { ItemType, NameType } from "@/types";

type SingleItemProps = {
    name: NameType;
    index: number;
    fields: ItemType[];
    field: FieldArrayWithId<ItemType>;
    moveFieldUp: (index: number) => void;
    moveFieldDown: (index: number) => void;
    removeField: (index: number) => void;
};

const SingleItem = ({
    name,
    index,
    fields,
    field,
    moveFieldUp,
    moveFieldDown,
    removeField,
}: SingleItemProps) => {
    const { control, setValue } = useFormContext();

    const { _t } = useTranslationContext();

    // Items
    const itemName = useWatch({
        name: `${name}[${index}].name`,
        control,
    });

    const rate = useWatch({
        name: `${name}[${index}].unitPrice`,
        control,
    });

    const quantity = useWatch({
        name: `${name}[${index}].quantity`,
        control,
    });

    const total = useWatch({
        name: `${name}[${index}].total`,
        control,
    });

    // Currency
    const currency = useWatch({
        name: `details.currency`,
        control,
    });

    useEffect(() => {
        // Calculate total when rate or quantity changes
        if (rate != undefined && quantity != undefined) {
            const calculatedTotal = (rate * quantity).toFixed(2);
            setValue(`${name}[${index}].total`, calculatedTotal);
        }
    }, [rate, quantity]);

    // DnD
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const boxDragClasses = isDragging
        ? "z-10 border-primary bg-muted"
        : "border-border bg-muted/40";

    const gripDragClasses = isDragging
        ? "opacity-0 group-hover:opacity-100 transition-opacity cursor-grabbing"
        : "cursor-grab";

    return (
        <div
            style={style}
            {...attributes}
            className={cn(
                "group my-2 flex cursor-default flex-col gap-y-5 rounded-xl border p-3 transition-colors",
                boxDragClasses
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                {itemName != "" ? (
                    <p className="font-medium">
                        #{index + 1} - {itemName}
                    </p>
                ) : (
                    <p className="font-medium">#{index + 1} - Empty name</p>
                )}

                <div className="flex gap-3">
                    {/* Drag and Drop Button */}
                    <div
                        className={`${gripDragClasses} flex justify-center items-center`}
                        ref={setNodeRef}
                        {...listeners}
                    >
                        <GripVertical className="text-muted-foreground transition-colors hover:text-primary" />
                    </div>

                    {/* Up Button */}
                    <BaseButton
                        size={"icon"}
                        tooltipLabel="Move the item up"
                        onClick={() => moveFieldUp(index)}
                        disabled={index === 0}
                    >
                        <ChevronUp />
                    </BaseButton>

                    {/* Down Button */}
                    <BaseButton
                        size={"icon"}
                        tooltipLabel="Move the item down"
                        onClick={() => moveFieldDown(index)}
                        disabled={index === fields.length - 1}
                    >
                        <ChevronDown />
                    </BaseButton>
                </div>
            </div>
            {/*
             * Name spans the full row on phones; quantity and rate share a row
             * beneath it. From sm up all four sit on one 12-column line.
             */}
            <div
                // Container query: a 12-column grid cannot fit the ~420px desktop rail.
                className="grid grid-cols-2 gap-x-3 gap-y-4 @xl:grid-cols-12"
                key={index}
            >
                <div className="col-span-2 min-w-0 @xl:col-span-5">
                    <FormInput
                        name={`${name}[${index}].name`}
                        label={_t("form.steps.lineItems.name")}
                        placeholder="Item name"
                        vertical
                    />
                </div>

                <div className="min-w-0 @xl:col-span-2">
                    <FormInput
                        name={`${name}[${index}].quantity`}
                        type="number"
                        label={_t("form.steps.lineItems.quantity")}
                        placeholder={_t("form.steps.lineItems.quantity")}
                        vertical
                    />
                </div>

                <div className="min-w-0 @xl:col-span-2">
                    <FormInput
                        name={`${name}[${index}].unitPrice`}
                        type="number"
                        label={_t("form.steps.lineItems.rate")}
                        labelHelper={`(${currency})`}
                        placeholder={_t("form.steps.lineItems.rate")}
                        vertical
                    />
                </div>

                <div className="col-span-2 flex min-w-0 flex-col gap-2 @xl:col-span-3">
                    <Label>{_t("form.steps.lineItems.total")}</Label>
                    <Input
                        value={`${total} ${currency}`}
                        readOnly
                        placeholder="Item total"
                        className="w-full border-none bg-transparent px-0 text-lg font-medium"
                    />
                </div>
            </div>
            <FormTextarea
                name={`${name}[${index}].description`}
                label={_t("form.steps.lineItems.description")}
                placeholder="Item description"
            />
            <div>
                {/* Not allowing deletion for first item when there is only 1 item */}
                {fields.length > 1 && (
                    <BaseButton
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeField(index)}
                    >
                        <Trash2 className="h-4 w-4" />
                        {_t("form.steps.lineItems.removeItem")}
                    </BaseButton>
                )}
            </div>
        </div>
    );
};

export default SingleItem;

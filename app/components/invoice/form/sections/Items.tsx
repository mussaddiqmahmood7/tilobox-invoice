"use client";

import React, { useCallback, useState } from "react";

// RHF
import { useFieldArray, useFormContext } from "react-hook-form";

// DnD
import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    UniqueIdentifier,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Components
import { BaseButton, SingleItem, Subheading, VoiceInput } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { Plus } from "lucide-react";

// Types
import { InvoiceType } from "@/types";

const Items = () => {
    const { control, setValue } = useFormContext<InvoiceType>();

    const { _t } = useTranslationContext();

    const ITEMS_NAME = "details.items";
    const { fields, append, remove, move } = useFieldArray({
        control: control,
        name: ITEMS_NAME,
    });

    const addNewField = () => {
        append({
            name: "",
            description: "",
            quantity: 0,
            unitPrice: 0,
            total: 0,
        });
    };

    const handleVoiceItemsParsed = (items: { name: string; quantity: number; unitPrice: number; description?: string }[]) => {
        items.forEach(item => {
            append({
                name: item.name,
                description: item.description || "",
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: 0,
            });
        });
    };

    const removeField = (index: number) => {
        remove(index);
    };

    const moveFieldUp = (index: number) => {
        if (index > 0) {
            move(index, index - 1);
        }
    };
    const moveFieldDown = (index: number) => {
        if (index < fields.length - 1) {
            move(index, index + 1);
        }
    };

    // DnD
    const [activeId, setActiveId] = useState<UniqueIdentifier>();

    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(active.id);

            if (active.id !== over?.id) {
                const oldIndex = fields.findIndex(
                    (item) => item.id === active.id
                );
                const newIndex = fields.findIndex(
                    (item) => item.id === over?.id
                );

                move(oldIndex, newIndex);
            }
        },
        [fields, setValue]
    );

    return (
        <section className="flex flex-col gap-2 w-full">
            <Subheading>{_t("form.steps.lineItems.heading")}:</Subheading>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(event) => {
                    const { active } = event;
                    setActiveId(active.id);
                }}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={fields}
                    strategy={verticalListSortingStrategy}
                >
                    {fields.map((field, index) => (
                        <SingleItem
                            key={field.id}
                            name={ITEMS_NAME}
                            index={index}
                            fields={fields}
                            field={field}
                            moveFieldUp={moveFieldUp}
                            moveFieldDown={moveFieldDown}
                            removeField={removeField}
                        />
                    ))}
                </SortableContext>
            </DndContext>
            <div className="flex flex-wrap gap-2">
                <BaseButton
                    tooltipLabel="Add a new item to the list"
                    onClick={addNewField}
                >
                    <Plus />
                    {_t("form.steps.lineItems.addNewItem")}
                </BaseButton>
                <VoiceInput onItemsParsed={handleVoiceItemsParsed} />
            </div>
        </section>
    );
};

export default Items;

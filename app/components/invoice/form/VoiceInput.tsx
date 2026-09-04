"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ShadCn
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons
import { Mic, MicOff, X, Check, Loader2, AlertCircle, Volume2 } from "lucide-react";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Types
import { ItemType } from "@/types";

// Voice recognition types
type SpeechRecognitionEvent = {
    results: SpeechRecognitionResultList;
    resultIndex: number;
};

type SpeechRecognitionResultList = {
    length: number;
    [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
    length: number;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
};

type SpeechRecognitionAlternative = {
    transcript: string;
    confidence: number;
};

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

// Parsed item from voice
type ParsedVoiceItem = {
    name: string;
    quantity: number;
    unitPrice: number;
    description?: string;
};

type VoiceInputProps = {
    onItemsParsed: (items: ParsedVoiceItem[]) => void;
};

// Chinese number mapping
const chineseNumbers: Record<string, number> = {
    '零': 0, '〇': 0,
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9,
    '十': 10, '百': 100, '千': 1000, '万': 10000,
    '壹': 1, '贰': 2, '叁': 3, '肆': 4, '伍': 5,
    '陆': 6, '柒': 7, '捌': 8, '玖': 9,
    '拾': 10, '佰': 100, '仟': 1000,
};

// Parse Chinese number to Arabic number
const parseChineseNumber = (text: string): number => {
    if (!text) return 0;
    
    const digitMatch = text.match(/\d+(\.\d+)?/);
    if (digitMatch) {
        return parseFloat(digitMatch[0]);
    }
    
    let result = 0;
    let temp = 0;
    let unit = 1;
    
    const chars = text.split('');
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const num = chineseNumbers[char];
        
        if (num === undefined) continue;
        
        if (num >= 10) {
            if (temp === 0) temp = 1;
            result += temp * num;
            temp = 0;
            unit = num;
        } else {
            temp = num;
        }
    }
    
    result += temp;
    return result || 0;
};

// Parse voice text to items
const parseVoiceText = (text: string): ParsedVoiceItem[] => {
    if (!text.trim()) return [];
    
    const items: ParsedVoiceItem[] = [];
    
    const itemSeparators = [
        /[,，。；;]/,
        /(?:另外|还有|接下来|然后|下一个|再添加|再加)/,
    ];
    
    const parts: string[] = [];
    let currentText = text;
    
    for (const separator of itemSeparators) {
        const splitParts = currentText.split(separator);
        if (splitParts.length > 1) {
            parts.push(...splitParts.filter(p => p.trim()));
            currentText = '';
            break;
        }
    }
    
    if (currentText) {
        parts.push(currentText);
    }
    
    for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart) continue;
        
        let quantity = 1;
        let unitPrice = 0;
        let name = trimmedPart;
        
        const quantityPatterns = [
            /(\d+(?:\.\d+)?)\s*(?:个|件|套|份|台|辆|本|张|块|瓶|盒|箱)/,
            /(?:数量|共|买了|添加|要|需要)\s*(\d+(?:\.\d+)?|[零一二三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟]+)/,
            /(\d+(?:\.\d+)?|[零一二三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟]+)\s*(?:个|件|套|份|台|辆|本|张|块|瓶|盒|箱)/,
        ];
        
        for (const pattern of quantityPatterns) {
            const match = trimmedPart.match(pattern);
            if (match) {
                const quantityStr = match[1];
                if (/^\d+(\.\d+)?$/.test(quantityStr)) {
                    quantity = parseFloat(quantityStr);
                } else {
                    quantity = parseChineseNumber(quantityStr);
                }
                if (quantity === 0) quantity = 1;
                name = name.replace(match[0], '').trim();
                break;
            }
        }
        
        const pricePatterns = [
            /(?:单价|价格|每个|每件|每份|每台|每辆|每本|每张|每块|每瓶|每盒|每箱)\s*(\d+(?:\.\d+)?)/,
            /(?:单价|价格|每个|每件|每份|每台|每辆|每本|每张|每块|每瓶|每盒|每箱)\s*([零一二三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟]+)/,
            /(\d+(?:\.\d+)?)\s*(?:元|块|美元|欧元|英镑|人民币)/,
            /(\d+(?:\.\d+)?)\s*元/,
        ];
        
        for (const pattern of pricePatterns) {
            const match = trimmedPart.match(pattern);
            if (match) {
                const priceStr = match[1];
                if (/^\d+(\.\d+)?$/.test(priceStr)) {
                    unitPrice = parseFloat(priceStr);
                } else {
                    unitPrice = parseChineseNumber(priceStr);
                }
                name = name.replace(match[0], '').trim();
                break;
            }
        }
        
        name = name
            .replace(/^(?:添加|新增|录入|记录|我要|我需要|请添加|请录入)/, '')
            .replace(/^(?:一个|一件|一套|一份|一台|一辆|一本|一张|一块|一瓶|一盒|一箱)/, '')
            .trim();
        
        if (name || unitPrice > 0) {
            items.push({
                name: name || '未命名商品',
                quantity: Math.max(1, quantity),
                unitPrice: Math.max(0, unitPrice),
                description: '',
            });
        }
    }
    
    return items;
};

const VoiceInput = ({ onItemsParsed }: VoiceInputProps) => {
    const { _t } = useTranslationContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [parsedItems, setParsedItems] = useState<ParsedVoiceItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);
    
    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(false);

    const initRecognition = useCallback(() => {
        try {
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognitionAPI) {
                setIsSupported(false);
                setError(_t('voiceInput.notSupported') || '您的浏览器不支持语音识别功能，请使用 Chrome 浏览器。');
                return null;
            }
            
            const recognition = new SpeechRecognitionAPI();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'zh-CN';
            
            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let interim = '';
                let final = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcript;
                    } else {
                        interim += transcript;
                    }
                }
                
                if (final) {
                    setTranscript(prev => prev + final);
                }
                setInterimTranscript(interim);
            };
            
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                let errorMessage = _t('voiceInput.error') || '语音识别出错';
                
                switch (event.error) {
                    case 'not-allowed':
                        errorMessage = _t('voiceInput.microphoneDenied') || '请允许麦克风权限后重试';
                        break;
                    case 'audio-capture':
                        errorMessage = _t('voiceInput.noMicrophone') || '未检测到麦克风设备';
                        break;
                    case 'network':
                        errorMessage = _t('voiceInput.networkError') || '网络连接错误，请检查网络';
                        break;
                }
                
                setError(errorMessage);
                setIsListening(false);
                isListeningRef.current = false;
            };
            
            recognition.onend = () => {
                if (isListeningRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('Restart failed:', e);
                    }
                }
            };
            
            return recognition;
        } catch (err) {
            console.error('Failed to initialize speech recognition:', err);
            setIsSupported(false);
            setError(_t('voiceInput.initFailed') || '语音识别初始化失败');
            return null;
        }
    }, [_t]);

    const startListening = useCallback(() => {
        setError(null);
        setTranscript('');
        setInterimTranscript('');
        setParsedItems([]);
        
        if (!recognitionRef.current) {
            recognitionRef.current = initRecognition();
            if (!recognitionRef.current) return;
        }
        
        try {
            recognitionRef.current.start();
            setIsListening(true);
            isListeningRef.current = true;
        } catch (err) {
            console.error('Failed to start recognition:', err);
            try {
                recognitionRef.current.stop();
                recognitionRef.current.start();
                setIsListening(true);
                isListeningRef.current = true;
            } catch (e2) {
                setError(_t('voiceInput.startFailed') || '无法启动语音识别，请重试');
            }
        }
    }, [initRecognition, _t]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            isListeningRef.current = false;
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.log('Stop failed:', e);
            }
        }
        setIsListening(false);
        setInterimTranscript('');
    }, []);

    const parseTranscript = useCallback(() => {
        const text = transcript;
        if (!text.trim()) {
            setError(_t('voiceInput.emptyText') || '请先录入语音内容');
            return;
        }
        
        const items = parseVoiceText(text);
        if (items.length === 0) {
            setError(_t('voiceInput.noItemsParsed') || '未能识别出商品信息，请重新录入');
            return;
        }
        
        setParsedItems(items);
        setError(null);
    }, [transcript, _t]);

    const confirmItems = useCallback(() => {
        if (parsedItems.length === 0) return;
        onItemsParsed(parsedItems);
        setIsOpen(false);
        setTranscript('');
        setParsedItems([]);
        setError(null);
    }, [parsedItems, onItemsParsed]);

    const removeItem = useCallback((index: number) => {
        setParsedItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updateItem = useCallback((index: number, field: keyof ParsedVoiceItem, value: string | number) => {
        setParsedItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            if (field === 'quantity' || field === 'unitPrice') {
                return { ...item, [field]: Number(value) || 0 };
            }
            return { ...item, [field]: value };
        }));
    }, []);

    const resetAll = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        setParsedItems([]);
        setError(null);
    }, []);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                isListeningRef.current = false;
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    console.log('Cleanup stop failed:', e);
                }
            }
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            stopListening();
            resetAll();
        }
    }, [isOpen, stopListening, resetAll]);

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="secondary"
                            className="flex gap-2"
                            onClick={() => setIsOpen(true)}
                        >
                            <Mic className="h-4 w-4" />
                            {_t('voiceInput.voiceInput') || '语音录入'}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{_t('voiceInput.tooltip') || '使用语音识别快速录入商品明细'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mic className="h-5 w-5 text-primary" />
                            {_t('voiceInput.title') || '语音录入商品明细'}
                        </DialogTitle>
                        <DialogDescription>
                            {_t('voiceInput.description') || '点击录音按钮开始说话，系统将自动识别并解析商品信息。'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {!isSupported && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="h-4 w-4" />
                                    <p className="text-sm font-medium">
                                        {_t('voiceInput.browserHint') || '浏览器不支持语音识别'}
                                    </p>
                                </div>
                                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                                    {_t('voiceInput.useChrome') || '请使用 Chrome 浏览器以使用语音识别功能，或手动在下方输入文本进行解析。'}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-4">
                            <Button
                                variant={isListening ? "destructive" : "default"}
                                size="lg"
                                className={`w-20 h-20 rounded-full transition-all duration-300 ${
                                    isListening 
                                        ? 'animate-pulse bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/50' 
                                        : 'bg-primary hover:bg-primary/90 shadow-elevated'
                                }`}
                                onClick={isListening ? stopListening : startListening}
                            >
                                {isListening ? (
                                    <MicOff className="h-8 w-8" />
                                ) : (
                                    <Mic className="h-8 w-8" />
                                )}
                            </Button>
                            
                            {isListening && (
                                <div className="flex items-center gap-2 text-primary">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm font-medium">
                                        {_t('voiceInput.listening') || '正在聆听...'}
                                    </span>
                                </div>
                            )}
                            
                            {interimTranscript && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    {interimTranscript}
                                </p>
                            )}
                        </div>

                        {!isSupported && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {_t('voiceInput.manualInput') || '手动输入文本'}
                                </label>
                                <Textarea
                                    placeholder={_t('voiceInput.manualPlaceholder') || '例如：苹果3个单价5元，笔记本电脑2台单价8000元'}
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>
                        )}

                        {transcript && !isListening && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        {_t('voiceInput.transcript') || '识别文本'}
                                    </label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetAll}
                                        className="h-6 px-2 text-xs"
                                    >
                                        <X className="h-3 w-3 me-1" />
                                        {_t('voiceInput.clear') || '清除'}
                                    </Button>
                                </div>
                                <Textarea
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    className="min-h-[80px] text-sm"
                                    readOnly={isSupported}
                                />
                            </div>
                        )}

                        {transcript && !isListening && (
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={startListening}
                                    className="flex-1"
                                >
                                    <Mic className="h-4 w-4 me-2" />
                                    {_t('voiceInput.continueRecording') || '继续录音'}
                                </Button>
                                <Button
                                    onClick={parseTranscript}
                                    className="flex-1"
                                >
                                    <Check className="h-4 w-4 me-2" />
                                    {_t('voiceInput.parse') || '解析商品'}
                                </Button>
                            </div>
                        )}

                        {parsedItems.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">
                                        {_t('voiceInput.parsedItems') || '解析结果'}
                                        <Badge variant="secondary" className="ms-2">
                                            {parsedItems.length}
                                        </Badge>
                                    </h3>
                                </div>
                                
                                <div className="space-y-2">
                                    {parsedItems.map((item, index) => (
                                        <div
                                            key={index}
                                            className="rounded-lg border border-border bg-muted/40 p-3"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {_t('voiceInput.item') || '商品'} #{index + 1}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(index)}
                                                    className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-3 md:col-span-1">
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                                        {_t('form.steps.lineItems.name') || '名称'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                        className="h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                                        {_t('form.steps.lineItems.quantity') || '数量'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                        className="h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="text-xs text-gray-500 dark:text-gray-400">
                                                        {_t('form.steps.lineItems.rate') || '单价'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                                        className="h-8 w-full rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsOpen(false);
                                resetAll();
                            }}
                        >
                            {_t('voiceInput.cancel') || '取消'}
                        </Button>
                        {parsedItems.length > 0 && (
                            <Button
                                onClick={confirmItems}
                                className="bg-green-500 hover:bg-green-600"
                            >
                                <Check className="h-4 w-4 me-2" />
                                {_t('voiceInput.confirm') || '确认添加'} ({parsedItems.length})
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default VoiceInput;

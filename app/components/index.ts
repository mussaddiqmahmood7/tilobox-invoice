/* =========================
   * Navigation
   ========================= */
import BaseNavbar from "./layout/BaseNavbar";
import BaseFooter from "./layout/BaseFooter";
import MobileActionBar from "./layout/MobileActionBar";

/* =========================
   * Invoice
   ========================= */
import InvoiceMain from "./invoice/InvoiceMain";
import InvoiceForm from "./invoice/InvoiceForm";
import InvoiceActions from "./invoice/InvoiceActions";

/* =========================
   * Invoice components
   ========================= */
// * Form
// Form components
import SingleItem from "./invoice/form/SingleItem";
import Charges from "./invoice/form/Charges";
import PartyPicker from "./invoice/form/PartyPicker";
import PaymentTermPresets from "./invoice/form/PaymentTermPresets";
import AutosaveIndicator from "./invoice/form/AutosaveIndicator";
import TemplateGallery from "./invoice/form/TemplateGallery";
import VoiceInput from "./invoice/form/VoiceInput";

// Form / Wizard
import WizardNavigation from "./invoice/form/wizard/WizardNavigation";
import WizardStep from "./invoice/form/wizard/WizardStep";
import WizardProgress from "./invoice/form/wizard/WizardProgress";

// Form / Sections
import BillFromSection from "./invoice/form/sections/BillFromSection";
import BillToSection from "./invoice/form/sections/BillToSection";
import InvoiceDetails from "./invoice/form/sections/InvoiceDetails";
import Items from "./invoice/form/sections/Items";
import PaymentInformation from "./invoice/form/sections/PaymentInformation";
import InvoiceSummary from "./invoice/form/sections/InvoiceSummary";
import ImportJsonButton from "./invoice/form/sections/ImportJsonButton";

// * Actions
import PdfViewer from "./invoice/actions/PdfViewer";
import LivePreview from "./invoice/actions/LivePreview";
import FinalPdf from "./invoice/actions/FinalPdf";
import MobilePreviewSheet from "./invoice/actions/MobilePreviewSheet";

// * Reusable components
// Form fields
import CurrencySelector from "./reusables/form-fields/CurrencySelector";
import FormInput from "./reusables/form-fields/FormInput";
import FormTextarea from "./reusables/form-fields/FormTextarea";
import DatePickerFormField from "./reusables/form-fields/DatePickerFormField";
import FormFile from "./reusables/form-fields/FormFile";
import ChargeInput from "./reusables/form-fields/ChargeInput";
import FormCustomInput from "./reusables/form-fields/FormCustomInput";

import BaseButton from "./reusables/BaseButton";
import ThemeSwitcher from "./reusables/ThemeSwitcher";
import LanguageSelector from "./reusables/LanguageSelector";
import Subheading from "./reusables/Subheading";

/* =========================
   * Modals & Alerts
   ========================= */
import SendPdfToEmailModal from "./modals/email/SendPdfToEmailModal";

// Import/Export
import InvoiceLoaderModal from "./modals/invoice/InvoiceLoaderModal";
import InvoiceExportModal from "./modals/invoice/InvoiceExportModal";

// Custom Selectors
import SavedInvoicesList from "./modals/invoice/components/SavedInvoicesList";

// Signature
import SignatureModal from "./modals/signature/SignatureModal";

/*
 * Signature / Tabs
 *
 * DrawSignature is deliberately NOT re-exported here. This barrel is imported
 * by nearly every component, so a static export of the drawing tab pulled
 * react-signature-canvas and signature_pad into the initial client bundle even
 * though the canvas only ever renders inside the signature modal. SignatureModal
 * loads it through next/dynamic from its own path instead.
 */
import TypeSignature from "./modals/signature/tabs/TypeSignature";
import UploadSignature from "./modals/signature/tabs/UploadSignature";

// Signature / Components
import SignatureColorSelector from "./modals/signature/components/SignatureColorSelector";
import SignatureFontSelector from "./modals/signature/components/SignatureFontSelector";

// Alerts
import NewInvoiceAlert from "./modals/alerts/NewInvoiceAlert";

/* =========================
   * Templates
   ========================= */
// Invoice templates
import DynamicInvoiceTemplate from "./templates/invoice-pdf/DynamicInvoiceTemplate";

// Email templates
import SendPdfEmail from "./templates/email/SendPdfEmail";

/* =========================
   ? DEV ONLY
   ========================= */
import DevDebug from "./dev/DevDebug";

export {
    BaseNavbar,
    BaseFooter,
    MobileActionBar,
    InvoiceMain,
    InvoiceForm,
    InvoiceActions,
    BillFromSection,
    BillToSection,
    InvoiceDetails,
    Items,
    SingleItem,
    Charges,
    PartyPicker,
    PaymentTermPresets,
    AutosaveIndicator,
    TemplateGallery,
    VoiceInput,
    WizardNavigation,
    WizardStep,
    WizardProgress,
    PaymentInformation,
    InvoiceSummary,
    CurrencySelector,
    SavedInvoicesList,
    PdfViewer,
    LivePreview,
    FinalPdf,
    MobilePreviewSheet,
    FormInput,
    FormTextarea,
    DatePickerFormField,
    FormFile,
    ChargeInput,
    FormCustomInput,
    BaseButton,
    ThemeSwitcher,
    LanguageSelector,
    Subheading,
    SendPdfToEmailModal,
    InvoiceLoaderModal,
    InvoiceExportModal,
    ImportJsonButton,
    SignatureModal,
    TypeSignature,
    UploadSignature,
    SignatureColorSelector,
    SignatureFontSelector,
    NewInvoiceAlert,
    DynamicInvoiceTemplate,
    SendPdfEmail,
    DevDebug,
};

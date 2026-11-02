import Link from "next/link";
import { LeadForm } from "../_components/lead-form";

export default function NovoLead() {
    return (
        <>
            <Link href="/leads" className="text-sm text-admin-muted hover:text-admin-text">
                ← Leads
            </Link>
            <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">Novo lead</h1>

            <div className="mt-6 max-w-3xl">
                <LeadForm mode="create" />
            </div>
        </>
    );
}

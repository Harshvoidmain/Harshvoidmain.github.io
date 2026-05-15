"use client";

import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { Building2, Mail, Shield, Database, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { AuthContext } from "@/lib/context/AuthContext";
import { updateDocument } from "@/lib/firebase/firestore";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { userDoc } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      institutionName: "Your Institution Name",
      address: "",
      contactEmail: "",
      academicYear: "2024-2025",
    },
  });

  const onSaveInstitution = async (data: Record<string, string>) => {
    setSaving(true);
    try {
      await updateDocument("institutions/main", data);
      toast.success("Institution settings saved.");
    } catch { toast.error("Failed to save settings."); }
    finally { setSaving(false); }
  };

  const handleTestEmail = () => {
    toast.info("Test email sent.");
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your IMS Portal" />

      <Tabs defaultValue="institution">
        <TabsList className="mb-6">
          <TabsTrigger value="institution"><Building2 className="w-3.5 h-3.5 mr-1.5" />Institution</TabsTrigger>
          <TabsTrigger value="email"><Mail className="w-3.5 h-3.5 mr-1.5" />Email</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-3.5 h-3.5 mr-1.5" />Security</TabsTrigger>
          <TabsTrigger value="system"><Database className="w-3.5 h-3.5 mr-1.5" />System</TabsTrigger>
        </TabsList>

        {/* Institution Settings */}
        <TabsContent value="institution">
          <div className="max-w-xl bg-white dark:bg-[#1C2128] rounded-lg border border-border p-6 shadow-card">
            <h3 className="font-heading font-semibold mb-4 text-[rgb(var(--text-primary))]">Institution Information</h3>
            <form onSubmit={handleSubmit(onSaveInstitution)} className="space-y-4">
              <Input label="Institution Name" required {...register("institutionName")} />
              <Input label="Address" {...register("address")} />
              <Input label="Contact Email" type="email" {...register("contactEmail")} />
              <Input label="Current Academic Year" placeholder="2024-2025" {...register("academicYear")} />
              <div>
                <label className="block text-sm font-medium mb-1.5">Institution Logo</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-sm text-muted">
                  Click to upload logo (PNG, SVG, max 5MB)
                </div>
              </div>
              <Button type="submit" variant="accent" loading={saving}>Save Institution Settings</Button>
            </form>
          </div>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <div className="max-w-xl bg-white dark:bg-[#1C2128] rounded-lg border border-border p-6 shadow-card space-y-4">
            <h3 className="font-heading font-semibold mb-4 text-[rgb(var(--text-primary))]">Email Configuration</h3>
            <Input label="SMTP Host" placeholder="smtp.gmail.com" />
            <Input label="SMTP Port" type="number" placeholder="587" />
            <Input label="SMTP Username" placeholder="noreply@institution.ac.in" />
            <Input label="SMTP Password" type="password" placeholder="••••••••" />
            <Input label="From Email" placeholder="noreply@institution.ac.in" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTestEmail}>Send Test Email</Button>
              <Button variant="accent">Save Email Settings</Button>
            </div>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="max-w-xl bg-white dark:bg-[#1C2128] rounded-lg border border-border p-6 shadow-card space-y-4">
            <h3 className="font-heading font-semibold mb-4 text-[rgb(var(--text-primary))]">Security Configuration</h3>
            <div>
              <label className="block text-sm font-medium mb-1.5">Minimum Password Length</label>
              <input type="number" defaultValue={8} min={8} max={20} className="h-9 w-24 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">Require Uppercase Letter</p>
                  <p className="text-xs text-muted">Password must contain at least one uppercase</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">Require Special Character</p>
                  <p className="text-xs text-muted">Password must contain at least one special char</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">Session Timeout</p>
                  <p className="text-xs text-muted">Auto-logout after inactivity</p>
                </div>
                <Switch />
              </div>
            </div>
            <Button variant="accent">Save Security Settings</Button>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <div className="max-w-xl bg-white dark:bg-[#1C2128] rounded-lg border border-border p-6 shadow-card space-y-4">
            <h3 className="font-heading font-semibold mb-4 text-[rgb(var(--text-primary))]">System Management</h3>
            <div className="p-4 rounded-lg border border-border">
              <h4 className="font-medium text-sm mb-1">Export All Data</h4>
              <p className="text-xs text-muted mb-3">Download a complete JSON backup of all Firestore data.</p>
              <Button variant="outline" size="sm">Export Data</Button>
            </div>
            <div className="p-4 rounded-lg border border-error/30 bg-red-50 dark:bg-red-900/10">
              <h4 className="font-medium text-sm text-error mb-1">Clear Test Data</h4>
              <p className="text-xs text-muted mb-3">Remove all seeded test data. This cannot be undone.</p>
              <Button variant="destructive" size="sm">Clear Test Data</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

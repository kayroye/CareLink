'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useReferrals } from '@/lib/db/hooks';
import { FACILITIES, FacilityId, Patient } from '@/lib/db/schema';
import { useAuth } from '@/contexts/AuthContext';
import { ImageUpload } from './ImageUpload';
import { PatientSelect } from './PatientSelect';
import { CreatePatientModal } from './CreatePatientModal';
import { toast } from 'sonner';
import { scanFormDefaults, scanFormSchema, ScanFormData, ScanFormOcrData } from './scanFormSchema';

export function ScanForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { addReferral } = useReferrals();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [suggestedPatientName, setSuggestedPatientName] = useState<string>();

  const form = useForm<ScanFormData>({
    defaultValues: scanFormDefaults,
    resolver: zodResolver(scanFormSchema),
    mode: 'onBlur',
  });

  const facilityId = form.watch('facilityId');
  const facility = FACILITIES.find((f) => f.id === facilityId);

  const handleOcrComplete = (data: ScanFormOcrData) => {
    if (data.patientName) {
      setSuggestedPatientName(data.patientName);
      form.setValue('patientName', data.patientName, { shouldValidate: true });
    }
    if (data.diagnosis) form.setValue('diagnosis', data.diagnosis, { shouldValidate: true });
    if (data.priority) form.setValue('priority', data.priority, { shouldValidate: true });
    if (data.referralType) form.setValue('referralType', data.referralType, { shouldValidate: true });
    if (data.notes) form.setValue('notes', data.notes, { shouldValidate: false });

    toast.success('Form auto-filled from OCR. Please verify and select patient.');
  };

  const handleOcrError = (error: string) => {
    toast.error(error);
  };

  const handlePatientSelect = useCallback(
    (patient: Patient | undefined) => {
      if (patient) {
        form.setValue('patientId', patient.id, { shouldValidate: true });
        form.setValue('patientName', patient.name, { shouldValidate: true });
        if (patient.phone) {
          form.setValue('patientPhone', patient.phone, { shouldValidate: true });
        }
      } else {
        form.setValue('patientId', '', { shouldValidate: true });
        form.setValue('patientName', '', { shouldValidate: true });
        form.setValue('patientPhone', '', { shouldValidate: true });
      }
    },
    [form]
  );

  const handleCreatePatient = useCallback((suggestedName?: string) => {
    setSuggestedPatientName(suggestedName);
    setShowCreateModal(true);
  }, []);

  const handlePatientCreated = useCallback(
    (patient: Patient) => {
      handlePatientSelect(patient);
      setShowCreateModal(false);
    },
    [handlePatientSelect]
  );

  const onSubmit = async (data: ScanFormData) => {
    try {
      await addReferral({
        patientId: data.patientId,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        diagnosis: data.diagnosis,
        patientSummary: data.patientSummary,
        createdByNurseId: user?.id || 'unknown',
        priority: data.priority,
        status: 'pending',
        facilityId: data.facilityId as FacilityId,
        referralType: data.referralType,
        notes: data.notes,
      });

      toast.success('Referral created and saved locally.');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to create referral.');
    }
  };

  return (
    <div className="space-y-6">
      <ImageUpload onOcrComplete={handleOcrComplete} onError={handleOcrError} />

      <Card className="card-elevated bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground font-semibold text-[18px] tracking-tight">
            Referral Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Patient Selection */}
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Patient *</FormLabel>
                    <FormControl>
                      <PatientSelect
                        value={field.value}
                        onSelect={handlePatientSelect}
                        onCreateNew={handleCreatePatient}
                        suggestedName={suggestedPatientName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Diagnosis / Reason for Referral *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the diagnosis or reason for this referral"
                        {...field}
                        className="bg-background resize-none min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patientSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Patient Summary *
                    </FormLabel>
                    <p className="text-xs text-muted-foreground mb-2">
                      This is what the patient will see. Use simple, non-medical language.
                    </p>
                    <FormControl>
                      <Textarea
                        placeholder="Explain this referral in simple terms for the patient..."
                        {...field}
                        className="bg-background resize-none min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="facilityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Facility *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('referralType', '', { shouldValidate: true });
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select facility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FACILITIES.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} ({f.distance})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referralType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Referral Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={!facility}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={facility ? 'Select type' : 'Select facility first'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {facility?.types.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Priority *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low - Routine</SelectItem>
                        <SelectItem value="medium">Medium - Standard</SelectItem>
                        <SelectItem value="high">High - Soon</SelectItem>
                        <SelectItem value="critical">Critical - Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information..."
                        {...field}
                        className="bg-background resize-none min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full font-semibold"
                  disabled={form.formState.isSubmitting}
                  size="lg"
                >
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Referral'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <CreatePatientModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onPatientCreated={handlePatientCreated}
        suggestedName={suggestedPatientName}
      />
    </div>
  );
}

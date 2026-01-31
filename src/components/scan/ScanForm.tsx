'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useReferrals } from '@/lib/db/hooks';
import { FACILITIES, FacilityId, Priority } from '@/lib/db/schema';
import { ImageUpload } from './ImageUpload';
import { toast } from 'sonner';
import { scanFormDefaults, scanFormSchema, ScanFormData, ScanFormOcrData } from './scanFormSchema';

export function ScanForm() {
  const router = useRouter();
  const { addReferral } = useReferrals();

  const form = useForm<ScanFormData>({
    defaultValues: scanFormDefaults,
    resolver: zodResolver(scanFormSchema),
    mode: 'onBlur',
  });

  const facilityId = form.watch('facilityId');
  const facility = FACILITIES.find((f) => f.id === facilityId);

  const handleOcrComplete = (data: ScanFormOcrData) => {
    if (data.patientName) form.setValue('patientName', data.patientName, { shouldValidate: true });
    if (data.diagnosis) form.setValue('diagnosis', data.diagnosis, { shouldValidate: true });
    if (data.priority) form.setValue('priority', data.priority as Priority, { shouldValidate: true });
    if (data.referralType) form.setValue('referralType', data.referralType, { shouldValidate: true });
    if (data.notes) form.setValue('notes', data.notes, { shouldValidate: false });

    toast.success('Form auto-filled from OCR. Please verify and complete.');
  };

  const handleOcrError = (error: string) => {
    toast.error(error);
  };

  const formatPhoneNumber = useCallback((value: string) => {
    // Remove all non-numeric characters
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    
    // Format with dashes: XXX-XXX-XXXX
    let formatted = '';
    if (limitedDigits.length > 0) {
      formatted = limitedDigits.slice(0, 3);
      if (limitedDigits.length > 3) {
        formatted += '-' + limitedDigits.slice(3, 6);
      }
      if (limitedDigits.length > 6) {
        formatted += '-' + limitedDigits.slice(6, 10);
      }
    }
    
    return formatted;
  }, []);

  const onSubmit = async (data: ScanFormData) => {
    try {
      await addReferral({
        ...data,
        status: 'pending',
        facilityId: data.facilityId as FacilityId,
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
          <CardTitle className="text-foreground font-semibold text-[18px] tracking-tight">Referral Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Patient Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="patientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="555-123-4567"
                          value={field.value ?? ''}
                          onChange={(event) => {
                            const formatted = formatPhoneNumber(event.target.value);
                            form.setValue('patientPhone', formatted, { shouldValidate: true });
                            field.onChange(formatted);
                          }}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Diagnosis / Reason for Referral *</FormLabel>
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!facility}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue
                              placeholder={facility ? 'Select type' : 'Select facility first'}
                            />
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
    </div>
  );
}

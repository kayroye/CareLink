'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferrals } from '@/lib/db/hooks';
import { FACILITIES, Priority, FacilityId } from '@/lib/db/schema';
import { ImageUpload } from './ImageUpload';
import { toast } from 'sonner';

interface FormData {
  patientName: string;
  patientPhone: string;
  diagnosis: string;
  priority: Priority;
  facilityId: FacilityId;
  referralType: string;
  notes: string;
}

export function ScanForm() {
  const router = useRouter();
  const { addReferral } = useReferrals();
  const [selectedFacility, setSelectedFacility] = useState<string>('');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      patientName: '',
      patientPhone: '',
      diagnosis: '',
      priority: 'medium',
      facilityId: '' as FacilityId,
      referralType: '',
      notes: '',
    },
  });

  const facility = FACILITIES.find((f) => f.id === selectedFacility);

  const handleOcrComplete = (data: any) => {
    if (data.patientName) setValue('patientName', data.patientName);
    if (data.diagnosis) setValue('diagnosis', data.diagnosis);
    if (data.priority) setValue('priority', data.priority);
    if (data.referralType) setValue('referralType', data.referralType);
    if (data.notes) setValue('notes', data.notes);

    toast.success('Form auto-filled from OCR. Please verify and complete.');
  };

  const handleOcrError = (error: string) => {
    toast.error(error);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-numeric characters
    const digits = e.target.value.replace(/\D/g, '');
    
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
    
    setValue('patientPhone', formatted);
  };

  const onSubmit = async (data: FormData) => {
    try {
      await addReferral({
        ...data,
        status: 'pending',
      });

      toast.success('Referral created and saved locally.');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to create referral.');
    }
  };

  return (
    <div className="space-y-6">
      <ImageUpload onOcrComplete={handleOcrComplete} onError={handleOcrError} />

      <Card>
        <CardHeader>
          <CardTitle>Referral Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  {...register('patientName', { required: 'Patient name is required' })}
                  placeholder="Full name"
                />
                {errors.patientName && (
                  <p className="text-sm text-red-500">{errors.patientName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientPhone">Phone Number</Label>
                <Input
                  id="patientPhone"
                  type="tel"
                  value={watch('patientPhone')}
                  onChange={handlePhoneChange}
                  placeholder="555-123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis / Reason for Referral *</Label>
              <Textarea
                id="diagnosis"
                {...register('diagnosis', { required: 'Diagnosis is required' })}
                placeholder="Describe the diagnosis or reason for this referral"
              />
              {errors.diagnosis && (
                <p className="text-sm text-red-500">{errors.diagnosis.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facilityId">Facility *</Label>
                <Select
                  value={selectedFacility}
                  onValueChange={(value) => {
                    setSelectedFacility(value);
                    setValue('facilityId', value as FacilityId);
                    setValue('referralType', ''); // Reset referral type when facility changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITIES.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.distance})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralType">Referral Type *</Label>
                <Select
                  value={watch('referralType')}
                  onValueChange={(value) => setValue('referralType', value)}
                  disabled={!facility}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={facility ? "Select type" : "Select facility first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {facility?.types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as Priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Routine</SelectItem>
                  <SelectItem value="medium">Medium - Standard</SelectItem>
                  <SelectItem value="high">High - Soon</SelectItem>
                  <SelectItem value="critical">Critical - Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any additional information..."
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Referral'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

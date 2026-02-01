'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, UserPlus, Check } from 'lucide-react';
import { usePatients } from '@/lib/db/use-patients';
import { Patient } from '@/lib/db/schema';

interface PatientSelectProps {
  value?: string; // patientId
  onSelect: (patient: Patient | undefined) => void;
  onCreateNew: (suggestedName?: string) => void;
  suggestedName?: string; // From OCR
}

export function PatientSelect({ value, onSelect, onCreateNew, suggestedName }: PatientSelectProps) {
  const { searchPatients, getPatientById, loading } = usePatients();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Array<{ item: Patient; score: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPatient = value ? getPatientById(value) : undefined;

  // Auto-search when suggestedName changes (from OCR)
  useEffect(() => {
    if (suggestedName && !value) {
      setQuery(suggestedName);
      const searchResults = searchPatients(suggestedName);
      setResults(searchResults);
      setIsOpen(true);
    }
  }, [suggestedName, value, searchPatients]);

  // Search as user types
  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchPatients(query);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [query, searchPatients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (patient: Patient) => {
    onSelect(patient);
    setQuery('');
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    onCreateNew(query || suggestedName);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="h-10 bg-muted animate-pulse rounded-md" />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {selectedPatient ? (
        <div className="flex items-center gap-2 p-3 bg-completed-muted rounded-md border border-completed-muted">
          <Check className="h-4 w-4 text-completed-foreground" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{selectedPatient.name}</p>
            <p className="text-sm text-muted-foreground truncate">{selectedPatient.email}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelect(undefined);
              setIsOpen(true);
            }}
          >
            Change
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients by name or email..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="pl-10 bg-background"
            />
          </div>

          {isOpen && (
            <Card className="absolute z-50 w-full mt-1 max-h-64 overflow-auto shadow-lg border-border">
              {results.length > 0 ? (
                <div className="p-1">
                  {results.map(({ item, score }) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.email} {item.phone && `· ${item.phone}`}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {Math.round((1 - score) * 100)}% match
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-4 text-center text-muted-foreground">
                  No patients found matching &quot;{query}&quot;
                </div>
              ) : null}

              <div className="border-t border-border p-1">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-accent"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create new patient{query ? `: "${query}"` : '...'}</span>
                </button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

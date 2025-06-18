
import React, { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Reporte {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  categoria: string;
  prioridad: string;
}

interface SearchComboboxProps {
  reportes: Reporte[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
}

export const SearchCombobox: React.FC<SearchComboboxProps> = ({
  reportes,
  value,
  onValueChange,
  placeholder = "Buscar reportes...",
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (selectedId: string) => {
    const isSelected = value.includes(selectedId);
    
    if (isSelected) {
      // Remover si ya está seleccionado
      onValueChange(value.filter(v => v !== selectedId));
    } else {
      // Agregar si no está seleccionado
      onValueChange([...value, selectedId]);
    }
  };

  const handleRemove = (idToRemove: string) => {
    onValueChange(value.filter(v => v !== idToRemove));
  };

  const selectedReportes = reportes.filter(reporte => 
    value.includes(reporte.id)
  );

  // Filtrar reportes basado en la búsqueda interna del componente
  const filteredReportes = reportes.filter(reporte => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      reporte.titulo.toLowerCase().includes(query) ||
      reporte.descripcion.toLowerCase().includes(query) ||
      reporte.estado.toLowerCase().includes(query) ||
      reporte.categoria.toLowerCase().includes(query) ||
      reporte.prioridad.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-10"
          >
            <div className="flex-1 text-left">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <span className="truncate">
                  {value.length === 1 
                    ? selectedReportes[0]?.titulo || 'Reporte seleccionado'
                    : `${value.length} reportes seleccionados`
                  }
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            <CommandInput 
              placeholder="Buscar reportes..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-60">
              <CommandEmpty>No se encontraron reportes.</CommandEmpty>
              <CommandGroup>
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {value.length}/{reportes.length} reportes seleccionados
                </div>
                {filteredReportes.map((reporte) => {
                  const isSelected = value.includes(reporte.id);
                  
                  return (
                    <CommandItem
                      key={reporte.id}
                      value={`${reporte.titulo}-${reporte.id}`}
                      onSelect={() => handleSelect(reporte.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{reporte.titulo}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {reporte.descripcion}
                        </span>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                            {reporte.categoria}
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                            {reporte.estado}
                          </span>
                          <span className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                            {reporte.prioridad}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Mostrar reportes seleccionados como badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedReportes.map((reporte) => (
            <Badge
              key={reporte.id}
              variant="secondary"
              className="flex items-center gap-1 max-w-xs"
            >
              <span className="truncate">{reporte.titulo}</span>
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleRemove(reporte.id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

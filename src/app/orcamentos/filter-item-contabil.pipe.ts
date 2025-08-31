import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterItemContabil', standalone: true })
export class FilterItemContabilPipe implements PipeTransform {
  transform(items: any[], filtro: string): any[] {
    if (!filtro) return items;
    return items.filter(item =>
      item.nomeItemContabil?.toLowerCase().includes(filtro.toLowerCase()) ||
      item.codigoItemContabil?.toLowerCase().includes(filtro.toLowerCase())
    );
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uniqueCentroCusto',
  standalone: true
})
export class UniqueCentroCustoPipe implements PipeTransform {
  transform(items: any[]): any[] {
    if (!items) return [];
    const seen = new Set();
    return items.filter(item => {
      const key = item.codigoCentroCusto + '|' + item.centroCusto;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

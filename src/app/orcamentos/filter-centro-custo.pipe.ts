import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterCentroCusto', standalone: true })
export class FilterCentroCustoPipe implements PipeTransform {
  transform(items: any[], filtro: string): any[] {
    if (!filtro) return items;
    return items.filter(item => item.codigoCentroCusto === filtro);
  }
}

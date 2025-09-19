import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterAno', standalone: true })
export class FilterAnoPipe implements PipeTransform {
  transform(items: any[], filtro: string): any[] {
    if (!filtro) return items;
    return items.filter(item => item.ano === filtro);
  }
}

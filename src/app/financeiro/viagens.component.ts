import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-viagens',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <main class="min-h-screen p-4 md:p-6 bg-gradient-to-br from-[#1A4E79] to-[#75C9C8]">
    <div class="max-w-full mx-auto px-4">
      <div class="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
        <div class="bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] p-3 rounded-t-lg">
          <h3 class="text-white font-semibold text-lg">Viagens</h3>
        </div>

        <!-- Conteúdo com max-height para caber no viewport e rolagem interna -->
        <div class="p-4 md:p-6 max-h-[calc(100vh-160px)] overflow-y-auto">
          <div class="grid grid-cols-1 gap-6">
            <!-- Formulário principal (card maior) -->
            <div class="bg-white rounded-lg p-6 md:p-8 border border-[#e6eef0] shadow-md w-full md:w-[90%] mx-auto min-h-[72vh]">
              <form #viagemForm="ngForm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Empresa a ser cobrada *</label>
                <input type="text" name="empresa" [(ngModel)]="model.empresaCobrar" required
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all shadow-sm hover:shadow-md" />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#1A4E79] mb-1">Favorecido *</label>
                <input type="text" name="favorecido" [(ngModel)]="model.favorecido" required
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
              </div>

              <div>
                <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Solicitante *</label>
                <input type="text" name="solicitante" [(ngModel)]="model.solicitante" readonly
                  class="w-full p-3 bg-gray-100 border border-[#e6eef0]/30 rounded-lg shadow-inner" />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#1A4E79] mb-1">Tipo de Plano *</label>
                <select name="tipoPlano" [(ngModel)]="model.tipoPlano" required
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all">
                  <option *ngFor="let t of tiposPlano" [value]="t">{{ t }}</option>
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Título *</label>
                <input type="text" name="titulo" [(ngModel)]="model.titulo" required
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all shadow-sm hover:shadow-md" />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#1A4E79] mb-1">Início *</label>
                <input type="date" name="inicio" [(ngModel)]="model.inicio" required
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#1A4E79] mb-1">Fim *</label>
                <input type="date" name="fim" [(ngModel)]="model.fim" required
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all" />
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Descrição</label>
                <textarea name="descricao" [(ngModel)]="model.descricao" rows="4"
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all resize-none shadow-sm"></textarea>
              </div>

              <div>
                <label class="block text-sm font-semibold text-[#1A4E79] mb-1">Centro de Custo *</label>
                <input type="text" name="centroCusto" [(ngModel)]="model.centroCusto" required
                  [ngClass]="{'border-red-500': centroCustoInvalid()}"
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#ff6b6b]/20 focus:border-red-400 transition-all shadow-sm" />
                <small *ngIf="centroCustoInvalid()" class="text-red-600">Informe o Centro de Custo</small>
              </div>

              <div>
                <label class="block text-sm font-medium text-[#1A4E79] mb-1">Item Contábil *</label>
                <select name="itemContabil" [(ngModel)]="model.itemContabil" required
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all">
                  <option value="">Selecione um item</option>
                  <option *ngFor="let it of itensContabeis" [value]="it">{{ it }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-[#1A4E79] mb-1">Classe Valor</label>
                <select name="classeValor" [(ngModel)]="model.classeValor"
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all">
                  <option value="">Selecione um item</option>
                  <option *ngFor="let c of classesValor" [value]="c">{{ c }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-[#1A4E79] mb-1">Motivo</label>
                <select name="motivo" [(ngModel)]="model.motivo"
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all">
                  <option value="">Selecione um item</option>
                  <option *ngFor="let m of motivos" [value]="m">{{ m }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-[#1A4E79] mb-1">% Faturamento Cliente</label>
                <select name="percentual" [(ngModel)]="model.percentualFaturamento"
                  class="w-full p-3 border border-[#75C9C8]/30 rounded-lg focus:ring-2 focus:ring-[#75C9C8] focus:border-transparent transition-all">
                  <option *ngFor="let p of percentuais" [value]="p">{{ p }}</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-4">
              <button type="button" (click)="voltar()" class="px-4 py-2 border rounded text-[#1A4E79] border-[#75C9C8] bg-white">Voltar</button>
              <button type="button" (click)="salvar(viagemForm)" class="px-4 py-2 bg-gradient-to-r from-[#1A4E79] to-[#75C9C8] text-white rounded hover:shadow-lg">Salvar</button>
            </div>
          </form>
        </div>

            <!-- Comprovantes (recolhível por padrão) -->
            <div class="bg-white rounded-lg p-4 md:p-6 border border-[#e6eef0] shadow-sm">
              <div class="flex items-center justify-between">
                <h4 class="text-[#1A4E79] font-semibold mb-0">Comprovantes</h4>
                <button type="button" (click)="showComprovantes = !showComprovantes" class="text-sm text-[#1A4E79] underline">
                  {{ showComprovantes ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>

              <div *ngIf="showComprovantes" class="mt-3">
                <div class="w-full min-h-[160px] border border-dashed border-gray-200 rounded flex items-center justify-center bg-gray-50 mb-4">
                  <div class="text-center text-sm text-gray-500">
                    <div class="mb-2">Arraste e solte ou selecione um arquivo</div>
                    <div class="text-xs">Formatos compatíveis: jpg, jpeg, png, gif e pdf</div>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <input type="file" (change)="onFileChange($event)" class="hidden" #fileInput />
                  <button type="button" (click)="triggerFile(fileInput)" class="px-4 py-2 bg-[#1A4E79] text-white rounded">Inserir um Comprovante</button>
                  <div *ngIf="model.uploadedFileName" class="text-sm text-gray-700">Arquivo: {{ model.uploadedFileName }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  `
})
export class ViagensComponent implements OnInit {
  model: any = {};
  showComprovantes: boolean = false;

  tiposPlano = ['Eventos clientes', 'Viagem técnica', 'Treinamento', 'Outro'];
  itensContabeis = ['Item A', 'Item B', 'Item C'];
  classesValor = ['Classe 1', 'Classe 2'];
  motivos = ['Motivo 1', 'Motivo 2'];
  percentuais = ['0 (Não Fatura)', '25%', '50%', '75%', '100%'];

  ngOnInit(): void {
    this.initModel();
  }

  initModel(): void {
    this.model = {
      empresaCobrar: '',
      favorecido: '',
      solicitante: localStorage.getItem('user_fullname') || '',
      tipoPlano: 'Eventos clientes',
      titulo: '',
      inicio: '',
      fim: '',
      descricao: '',
      centroCusto: '',
      itemContabil: '',
      classeValor: '',
      motivo: '',
      percentualFaturamento: '0 (Não Fatura)'
    };
  }

  centroCustoInvalid(): boolean {
    return !this.model.centroCusto || this.model.centroCusto.trim().length === 0;
  }

  triggerFile(input: HTMLInputElement): void {
    input.click();
  }

  onFileChange(event: any): void {
    // Placeholder: apenas guarda nome do arquivo
    const f = event.target?.files?.[0];
    if (f) this.model.uploadedFileName = f.name;
  }

  voltar(): void {
    try { window.history.back(); } catch { }
  }

  salvar(form: any): void {
    // validação mínima
    if (!this.model.empresaCobrar || !this.model.favorecido || this.centroCustoInvalid() || !this.model.titulo) {
      alert('Preencha os campos obrigatórios marcados com *');
      return;
    }

    // Simular salvar
    console.log('Salvar viagem', this.model);
    alert('Viagem salva (simulação)');
  }
}


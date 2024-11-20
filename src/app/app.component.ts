import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

interface IKonstanten {
  BEITRAGSBEMESSUNGSGRENZE_KV_PV: number;
  BEITRAGSSATZ_KV: number;
  BEITRAGSSATZ_PV: number;
  BEITRAGSSATZ_PV_NO_CHILD: number;

  BEITRAGSBEMESSUNGSGRENZE_RV_AV: number;
  BEITRAGSSATZ_RV: number;
  BEITRAGSSATZ_AV: number;
}

const jahre = ['2024', '2025'] as const;

type year = typeof jahre[number];

const konstanten: { [key in year]: IKonstanten } = {
  '2024': {
    BEITRAGSBEMESSUNGSGRENZE_KV_PV: 5175,
    BEITRAGSSATZ_KV: 14.6,
    BEITRAGSSATZ_PV: 3.4,
    BEITRAGSSATZ_PV_NO_CHILD: 0.6,
    BEITRAGSBEMESSUNGSGRENZE_RV_AV: 7550,
    BEITRAGSSATZ_RV: 18.6,
    BEITRAGSSATZ_AV: 2.6,
  },
  '2025': {
    BEITRAGSBEMESSUNGSGRENZE_KV_PV: 5512.5,
    BEITRAGSSATZ_KV: 14.6,
    BEITRAGSSATZ_PV: 3.4,
    BEITRAGSSATZ_PV_NO_CHILD: 0.6,
    BEITRAGSBEMESSUNGSGRENZE_RV_AV: 8050,
    BEITRAGSSATZ_RV: 18.6,
    BEITRAGSSATZ_AV: 2.6,
  }
}

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private fb = inject(FormBuilder);

  jahre = jahre;
  data: IEinkommenData[] = [];
  private counter = 0;

  fg = this.fb.group<EinkommenDataForm>({
    id: new FormControl(0, { nonNullable: true }),
    jahr: new FormControl(jahre[0], { nonNullable: true }),
    bruttoMonat: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    age: new FormControl(28, { nonNullable: true, validators: [Validators.required, Validators.min(16)] }),
    zusatzBeitragKv: new FormControl(1.7, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    hasChildren: new FormControl(false, { nonNullable: true }),
  })

  onSubmit() {
    const row = { ...this.fg.getRawValue() };
    row.id = ++this.counter;
    this.data = [...this.data, row];

    this.fg.reset();
  }

  onRemove(index: number) {
    const newArray = [...this.data]
    newArray.splice(index, 1);
    this.data = newArray;
  }

  toFixed(num: number) {
    return Math.round(num * 100) / 100;
  }

  private getKvPvBrutto(item: IEinkommenData) {
    return Math.min(item.bruttoMonat, konstanten[item.jahr].BEITRAGSBEMESSUNGSGRENZE_KV_PV)
  }

  getKv(item: IEinkommenData) {
    const factor = (konstanten[item.jahr].BEITRAGSSATZ_KV + item.zusatzBeitragKv) / 100 / 2

    return this.toFixed(this.getKvPvBrutto(item) * factor);
  }

  getPv(item: IEinkommenData, arbeitnehmer: boolean) {
    let factor = konstanten[item.jahr].BEITRAGSSATZ_PV / 100 / 2;
    if (arbeitnehmer && item.age >= 23 && !item.hasChildren) {
      factor += konstanten[item.jahr].BEITRAGSSATZ_PV_NO_CHILD / 100;
    }

    return this.toFixed(this.getKvPvBrutto(item) * factor);
  }

  private getRvAvBrutto(item: IEinkommenData) {
    return Math.min(item.bruttoMonat, konstanten[item.jahr].BEITRAGSBEMESSUNGSGRENZE_RV_AV)
  }

  getRv(item: IEinkommenData) {
    const factor = konstanten[item.jahr].BEITRAGSSATZ_RV / 100 / 2

    return this.toFixed(this.getRvAvBrutto(item) * factor);
  }

  getAv(item: IEinkommenData) {
    const factor = konstanten[item.jahr].BEITRAGSSATZ_AV / 100 / 2

    return this.toFixed(this.getRvAvBrutto(item) * factor);
  }
}

type EinkommenDataForm = {
  [Property in keyof IEinkommenData]: FormControl<IEinkommenData[Property]>
}

interface IEinkommenData {
  id: number;
  jahr: year;
  bruttoMonat: number;
  age: number;
  zusatzBeitragKv: number;
  hasChildren: boolean;
}
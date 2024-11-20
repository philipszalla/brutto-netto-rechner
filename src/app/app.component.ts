import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

const BEITRAGSBEMESSUNGSGRENZE_KV = 5175;
const BEITRAGSSATZ_KV = 14.6;
const BEITRAGSSATZ_PV = 3.4;
const BEITRAGSSATZ_PV_NO_CHILD = 0.6;

const BEITRAGSBEMESSUNGSGRENZE_RV = 7550;
const BEITRAGSSATZ_RV = 18.6;
const BEITRAGSSATZ_AV = 2.6;

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private fb = inject(FormBuilder);

  data: IEinkommenData[] = [];
  private counter = 0;

  fg = this.fb.group<EinkommenDataForm>({
    id: new FormControl(0, { nonNullable: true }),
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

  private getKvBrutto(brutto: number) {
    return Math.min(brutto, BEITRAGSBEMESSUNGSGRENZE_KV)
  }

  getKv(item: IEinkommenData) {
    const factor = (BEITRAGSSATZ_KV + item.zusatzBeitragKv) / 100 / 2

    return this.toFixed(this.getKvBrutto(item.bruttoMonat) * factor);
  }

  getPv(item: IEinkommenData, arbeitnehmer: boolean) {
    let factor = BEITRAGSSATZ_PV / 100 / 2;
    if (arbeitnehmer && item.age >= 23 && !item.hasChildren) {
      factor += BEITRAGSSATZ_PV_NO_CHILD / 100;
    }

    return this.toFixed(this.getKvBrutto(item.bruttoMonat) * factor);
  }

  private getRvBrutto(brutto: number) {
    return Math.min(brutto, BEITRAGSBEMESSUNGSGRENZE_RV)
  }

  getRv(item: IEinkommenData) {
    const factor = BEITRAGSSATZ_RV / 100 / 2

    return this.toFixed(this.getRvBrutto(item.bruttoMonat) * factor);
  }

  getAv(item: IEinkommenData) {
    const factor = BEITRAGSSATZ_AV / 100 / 2

    return this.toFixed(this.getRvBrutto(item.bruttoMonat) * factor);
  }
}

type EinkommenDataForm = {
  [Property in keyof IEinkommenData]: FormControl<IEinkommenData[Property]>
}

interface IEinkommenData {
  id: number;
  bruttoMonat: number;
  age: number;
  zusatzBeitragKv: number;
  hasChildren: boolean;
}
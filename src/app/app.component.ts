import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

const BEITRAGSSATZ_KV = 14.6;
const BEITRAGSBEMESSUNGSGRENZE_KV = 5175;

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
    zusatzBeitragKv: new FormControl(1.7, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
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

  getKv(item: IEinkommenData) {
    const brutto = Math.min(item.bruttoMonat, BEITRAGSBEMESSUNGSGRENZE_KV);
    const factor = (BEITRAGSSATZ_KV + item.zusatzBeitragKv) / 100

    return this.toFixed(brutto * factor / 2);
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
}
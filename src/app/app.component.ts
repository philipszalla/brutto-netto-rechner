import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

interface IKonstanten {
  BEITRAGSBEMESSUNGSGRENZE_KV_PV: number;
  BEITRAGSSATZ_KV: number;
  BEITRAGSSATZ_KV_ERMSG: number;
  BEITRAGSSATZ_PV: number;
  BEITRAGSSATZ_PV_NO_CHILD: number;

  BEITRAGSBEMESSUNGSGRENZE_RV_AV: number;
  BEITRAGSSATZ_RV: number;
  BEITRAGSSATZ_AV: number;

  LOHNSTEUER: (zvE: number) => number;
  WERBE_KOST_PAUSCHALE: number;

  BEITRAGSSATZ_SOLI: number;
  SOLI_FREIBETRAG: number;
  SOLI_MINDERUNGSZONE: number;
}

const jahre = ['2024', '2025'] as const;

type year = typeof jahre[number];

const konstanten: { [key in year]: IKonstanten } = {
  '2024': {
    BEITRAGSBEMESSUNGSGRENZE_KV_PV: 5175,
    BEITRAGSSATZ_KV: 14.6,
    BEITRAGSSATZ_KV_ERMSG: 14,
    BEITRAGSSATZ_PV: 3.4,
    BEITRAGSSATZ_PV_NO_CHILD: 0.6,

    BEITRAGSBEMESSUNGSGRENZE_RV_AV: 7550,
    BEITRAGSSATZ_RV: 18.6,
    BEITRAGSSATZ_AV: 2.6,

    LOHNSTEUER(zvE) {
      // EStG §32a

      // Grundfreibetrag
      if (zvE <= 11604) {
        return 0;
      }

      if (zvE <= 17005) {
        const y = (zvE - 11604) / 10000;
        return (922.98 * y + 1400) * y;
      }

      if (zvE <= 66760) {
        const z = (zvE - 17005) / 10000;
        return (181.19 * z + 2397) * z + 1025.38;
      }

      if (zvE <= 277825) {
        return 0.42 * zvE - 10602.13;
      }

      // Höchststeuersatz
      return 0.45 * zvE - 18936.88;
    },
    WERBE_KOST_PAUSCHALE: 1230,

    BEITRAGSSATZ_SOLI: 5.5,
    SOLI_FREIBETRAG: 18130 / 12,
    SOLI_MINDERUNGSZONE: 11.9,
  },
  '2025': {
    BEITRAGSBEMESSUNGSGRENZE_KV_PV: 5512.5,
    BEITRAGSSATZ_KV: 14.6,
    BEITRAGSSATZ_KV_ERMSG: 14,
    BEITRAGSSATZ_PV: 3.4,
    BEITRAGSSATZ_PV_NO_CHILD: 0.6,

    BEITRAGSBEMESSUNGSGRENZE_RV_AV: 8050,
    BEITRAGSSATZ_RV: 18.6,
    BEITRAGSSATZ_AV: 2.6,

    LOHNSTEUER(_zvE) {
      // TODO
      return NaN;
    },
    WERBE_KOST_PAUSCHALE: 1230,

    BEITRAGSSATZ_SOLI: 5.5,
    SOLI_FREIBETRAG: NaN,
    SOLI_MINDERUNGSZONE: NaN,
  }
}

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, CommonModule],
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

  private getKvPvBrutto(item: IEinkommenData) {
    return Math.min(item.bruttoMonat, konstanten[item.jahr].BEITRAGSBEMESSUNGSGRENZE_KV_PV)
  }

  getKv(item: IEinkommenData, ermsg: boolean = false) {
    const beitragssatz = !ermsg ? konstanten[item.jahr].BEITRAGSSATZ_KV : konstanten[item.jahr].BEITRAGSSATZ_KV_ERMSG;
    const factor = (beitragssatz + item.zusatzBeitragKv) / 100 / 2

    return this.getKvPvBrutto(item) * factor;
  }

  getPv(item: IEinkommenData, arbeitnehmer: boolean) {
    let factor = konstanten[item.jahr].BEITRAGSSATZ_PV / 100 / 2;
    if (arbeitnehmer && item.age >= 23 && !item.hasChildren) {
      factor += konstanten[item.jahr].BEITRAGSSATZ_PV_NO_CHILD / 100;
    }

    return this.getKvPvBrutto(item) * factor;
  }

  private getRvAvBrutto(item: IEinkommenData) {
    return Math.min(item.bruttoMonat, konstanten[item.jahr].BEITRAGSBEMESSUNGSGRENZE_RV_AV)
  }

  getRv(item: IEinkommenData) {
    const factor = konstanten[item.jahr].BEITRAGSSATZ_RV / 100 / 2

    return this.getRvAvBrutto(item) * factor;
  }

  getAv(item: IEinkommenData) {
    const factor = konstanten[item.jahr].BEITRAGSSATZ_AV / 100 / 2

    return this.getRvAvBrutto(item) * factor;
  }

  getZvE(item: IEinkommenData) {
    const sonderausgaben = (this.getKv(item, true)
      + this.getPv(item, true)
      + this.getRv(item)) * 12;

    return item.bruttoMonat * 12 - sonderausgaben - konstanten[item.jahr].WERBE_KOST_PAUSCHALE - 36;
  }

  getLohnsteuer(item: IEinkommenData) {
    const zvE = this.getZvE(item);

    return konstanten[item.jahr].LOHNSTEUER(zvE) / 12;
  }

  getSoli(item: IEinkommenData) {
    const lohnsteuer = this.getLohnsteuer(item);
    const factor = konstanten[item.jahr].BEITRAGSSATZ_SOLI / 100;

    if (lohnsteuer < konstanten[item.jahr].SOLI_FREIBETRAG) {
      return 0;
    }

    const soli = lohnsteuer * factor;
    const minderungszone = (lohnsteuer - konstanten[item.jahr].SOLI_FREIBETRAG) * konstanten[item.jahr].SOLI_MINDERUNGSZONE / 100;

    return Math.min(soli, minderungszone);
  }

  getNetto(item: IEinkommenData) {
    return (item.bruttoMonat
      - this.getKv(item)
      - this.getPv(item, true)
      - this.getRv(item)
      - this.getAv(item)
      - this.getLohnsteuer(item)
      - this.getSoli(item));
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
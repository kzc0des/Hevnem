import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: "",
        loadComponent: () => import('./layouts/hevnem-layout/hevnem-layout').then((l) => l.HevnemLayout)
    }
];

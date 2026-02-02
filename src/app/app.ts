import { Component, signal, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./shared/header/header";
import { Footer } from "./shared/footer/footer";
import { HomePage } from "./components/home-page/home-page";
import { SampleHeader } from "./sample-registar/sample-header/sample-header";
import { DrawerComponent } from "./sample-registar/drawer-component/drawer-component";
import { SampleDashboard } from "./components/sample-dashboard/sample-dashboard";

@Component({
  selector: 'app-root',
   standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('epal-lab');
}

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./shared/header/header";
import { Footer } from "./shared/footer/footer";
import { HomePage } from "./components/home-page/home-page";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, HomePage],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('epal-lab');
}

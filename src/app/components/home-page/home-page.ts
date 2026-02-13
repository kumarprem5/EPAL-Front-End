import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from "../../shared/header/header";

@Component({
  selector: 'app-home-page',
  imports: [Header],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {

  constructor(private router: Router) {}

  goToSampleLogin() {
    this.router.navigate(['/sample/login']);

}

goToAnalystLogin(){
   this.router.navigate(['/analyst/login']);


}

goToTechanicianLogin(){

  this.router.navigate(['/techanician/login']);
}
}
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { delay, switchMap, tap } from 'rxjs/operators';
import { Details, Order } from 'src/app/shared/interfaces/order';
import { Store } from 'src/app/shared/interfaces/stores';
import { DataService } from 'src/app/shared/services/data.service';
import { ShoppingCartService } from 'src/app/shared/services/shopping-cart.service';
import { Product } from '../products/interfaces/product.interface';
import { ProductsService } from '../products/services/products.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  model = {
    name: '',
    store: '',
    shippingAddress: '',
    city: ''
  }

  stores:Store[] = []
  isDelivery: boolean = false
  cart:Product[] = []

  constructor(private dataSvc: DataService, private shoppingCart: ShoppingCartService, private router:Router, private productsSvc: ProductsService) {
    this.checkIfCartIsEmpty()
   }

  ngOnInit(): void {
    this.getStores()
    this.getDataCart()
    this.prepareDetails()
  }

  onPickupOrDelivery(value:boolean):void{
    this.isDelivery = value
  }

  onSubmit({value: formData}:NgForm):void{
    let data:Order = {
      ...formData,
      date:this.getCurrentDay(),
      pickup:!this.isDelivery
    }

    this.dataSvc.saveOrder(data).pipe(
      switchMap((order)=>{
        let orderId = order.id
        let details = this.prepareDetails()
        return this.dataSvc.saveDetailsOrder({details,orderId})
      }),
      tap(()=>this.router.navigate(['/checkout/thankYouPage'])),
      delay(2000),
      tap(()=> this.shoppingCart.resetShoppingCart())
    ).subscribe()
  }

  private getStores():void{
    this.dataSvc.getStores().pipe(
      tap((stores:Store[])=>this.stores = stores)
    ).subscribe()
  }

  private getCurrentDay():string{
    return new Date().toLocaleDateString()
  }

  private prepareDetails():Details[]{
    let details:Details[] = []
    this.cart.forEach((product:Product)=>{
      let {id:productId, name:productName, quantity, stock} = product
      let updateStock = (stock - quantity)
      this.productsSvc.updateStock(productId,updateStock).pipe(
        tap(()=> details.push({productId,productName,quantity}))
      ).subscribe()
      
    })
    return details
  }

  private getDataCart():void{
    this.shoppingCart.cartAction$.pipe(
      tap((products:Product[])=>this.cart = products)
    ).subscribe()
  }

  private checkIfCartIsEmpty():void{
    this.shoppingCart.cartAction$.pipe(
      tap((products:Product[])=>{
        if(Array.isArray(products) && !products.length){
          this.router.navigate(['/products'])
        }
      })
    ).subscribe()
  }

}

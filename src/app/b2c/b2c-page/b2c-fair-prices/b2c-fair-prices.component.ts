import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { B2cPageComponent } from '../b2c-page.component';
import { ApiBusinessToCustomerSettings } from '../../../../api/model/apiBusinessToCustomerSettings';
import GraphicPriceToProducerEnum = ApiBusinessToCustomerSettings.GraphicPriceToProducerEnum;
import GraphicFarmGatePriceEnum = ApiBusinessToCustomerSettings.GraphicFarmGatePriceEnum;

@Component({
    selector: 'app-b2c-fair-prices',
    templateUrl: './b2c-fair-prices.component.html',
    styleUrls: ['./b2c-fair-prices.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class B2cFairPricesComponent implements OnInit {

  private static POUND_TO_KG = 0.453592;

  private static PRODUCER_GRAPHIC_HEIGHT = 220;

  private static FARMGATE_GRAPHIC_HEIGHT = 220;

  b2cSettings: ApiBusinessToCustomerSettings;

  title = $localize`:@@frontPage.fair-prices.title:Fair prices`;
  title2 = $localize`:@@frontPage.fair-prices.title2:Increase of farmers' income through`;

  desc: string = null;
  descPricing: string = null;

  worldMarketPrice: number = null;
  fairTradePrice: number = null;
  productPrice: number = null;

  farmGateAveragePrice: number;
  private farmGateProductPrice: number;
  increaseOfCoffee: string = null;

  worldMarketPriceHeight: number = null;
  fairTradePriceHeight: number = null;
  productPriceHeight: number = null;

  farmGateAveragePriceHeight: number = null;
  increaseOfCoffeeHeight: number = null;

  orderId = '';

  chartsArePrepared = false;

  label1 = $localize`:@@frontPage.fair-prices.barChart.label1:World market price for Arabica coffee`;
  label2 = $localize`:@@frontPage.fair-prices.barChart.label2:Fairtrade Price`;

  label0Farmers = $localize`:@@frontPage.fair-prices.barChart.label0Farmers:Increase in % per kg of coffee sold`;

  productName = '';
  
  producerPriceGraphic: boolean;
  producerPriceGraphicUnit: string;
  producerPriceGraphicText: string;

  farmerPriceGraphic: boolean;

  producerUnitEnum = GraphicPriceToProducerEnum;

  constructor(
      @Inject(B2cPageComponent) private b2cPage: B2cPageComponent
  ) {
    this.b2cSettings = b2cPage.b2cSettings;
  }

  ngOnInit(): void {
    this.initLabel().then();
  }

  async initLabel() {
    this.pricesAndDescription(this.b2cPage.publicProductLabel.fields);

    if (this.b2cPage.qrTag !== 'EMPTY') {
      this.orderId = this.b2cPage.qrProductLabel.orderId;
    }

    switch (this.b2cSettings.graphicPriceToProducer) {
      case ApiBusinessToCustomerSettings.GraphicPriceToProducerEnum.DISABLED:
        this.producerPriceGraphic = false;
        break;
      case ApiBusinessToCustomerSettings.GraphicPriceToProducerEnum.PERCONTAINER:
        this.producerPriceGraphic = true;
        this.producerPriceGraphicUnit = $localize`:@@productLabel.b2c.price.unit.container:per container`;
        break;
      case ApiBusinessToCustomerSettings.GraphicPriceToProducerEnum.PERKG:
        this.producerPriceGraphic = true;
        this.producerPriceGraphicUnit = $localize`:@@productLabel.b2c.price.unit.kg:per kg`;
        break;
      case ApiBusinessToCustomerSettings.GraphicPriceToProducerEnum.PERCENTVALUE:
        this.producerPriceGraphic = true;
        this.producerPriceGraphicUnit = $localize`:@@productLabel.b2c.price.unit.percentValue:% value`;
        break;
    }

    this.producerPriceGraphicText = $localize`:@@front-page.fair-prices.paragraph1:${this.orderId}:INTERPOLATION:${this.producerPriceGraphicUnit}:UNIT:`;

    switch (this.b2cSettings.graphicFarmGatePrice) {
      case ApiBusinessToCustomerSettings.GraphicFarmGatePriceEnum.DISABLED:
        this.farmerPriceGraphic = false;
        break;
      default:
        this.farmerPriceGraphic = true;
        break;
    }
  }

  pricesAndDescription(data) {

    for (const item of data) {

      if (item.name === 'name') {
        this.productName = item.value;
      }

      if (item.name === 'comparisonOfPrice.description') {
        this.desc = item.value;
      }
      if (item.name === 'settings.incomeIncreaseDescription') {
        this.descPricing = item.value;
      }
    }

    const producerPrice = this.b2cPage.qrProductLabel.priceToProducer ? this.b2cPage.qrProductLabel.priceToProducer : this.b2cSettings.manualProducerPrice;
    switch (this.b2cSettings.graphicPriceToProducer) {
      case ApiBusinessToCustomerSettings.GraphicPriceToProducerEnum.PERCONTAINER:
        this.worldMarketPrice = Math.ceil(this.b2cSettings.worldMarket / B2cFairPricesComponent.POUND_TO_KG * this.b2cSettings.containerSize);
        this.fairTradePrice = Math.ceil(this.b2cSettings.fairTrade / B2cFairPricesComponent.POUND_TO_KG * this.b2cSettings.containerSize);
        this.productPrice = Math.ceil(producerPrice * this.b2cSettings.containerSize);
        break;
      case ApiBusinessToCustomerSettings.GraphicPriceToProducerEnum.PERKG:
        this.worldMarketPrice = Math.ceil(this.b2cSettings.worldMarket / B2cFairPricesComponent.POUND_TO_KG);
        this.fairTradePrice = Math.ceil(this.b2cSettings.fairTrade / B2cFairPricesComponent.POUND_TO_KG);
        this.productPrice = Math.ceil(producerPrice);
        break;
      case GraphicPriceToProducerEnum.PERCENTVALUE:
        this.worldMarketPrice = 100;
        this.fairTradePrice = Math.round(this.b2cSettings.fairTrade / this.b2cSettings.worldMarket * 100);
        this.productPrice = Math.round(producerPrice / (this.b2cSettings.worldMarket / B2cFairPricesComponent.POUND_TO_KG) * 100);
        break;
    }

    // Calculate producer graphic chart bars height
    const worldMarketPriceHeight = 40;
    const fairTradePriceHeight = worldMarketPriceHeight * this.fairTradePrice / this.worldMarketPrice;
    const productPriceHeight = worldMarketPriceHeight * this.productPrice / this.worldMarketPrice;

    // Normalize the heights to a maximum graphic height
    const maxBarValue = Math.max(worldMarketPriceHeight, fairTradePriceHeight, productPriceHeight);
    const producerGraphicScale = B2cFairPricesComponent.PRODUCER_GRAPHIC_HEIGHT / maxBarValue;

    this.worldMarketPriceHeight = worldMarketPriceHeight * producerGraphicScale;
    this.fairTradePriceHeight = fairTradePriceHeight * producerGraphicScale;
    this.productPriceHeight = productPriceHeight * producerGraphicScale;

    const farmGatePrice = this.b2cPage.qrProductLabel.priceToFarmer ? this.b2cPage.qrProductLabel.priceToFarmer : this.b2cSettings.manualFarmGatePrice;
    switch (this.b2cSettings.graphicFarmGatePrice) {
      case ApiBusinessToCustomerSettings.GraphicFarmGatePriceEnum.PERCONTAINER:
        this.farmGateAveragePrice = Math.ceil(this.b2cSettings.averageRegionFarmGatePrice / B2cFairPricesComponent.POUND_TO_KG * this.b2cSettings.containerSize);
        this.farmGateProductPrice = farmGatePrice * this.b2cSettings.containerSize;
        this.increaseOfCoffee = '$' +  Math.ceil(this.farmGateProductPrice);
        break;
      case ApiBusinessToCustomerSettings.GraphicFarmGatePriceEnum.PERKG:
        this.farmGateAveragePrice = Math.ceil(this.b2cSettings.averageRegionFarmGatePrice / B2cFairPricesComponent.POUND_TO_KG);
        this.farmGateProductPrice = farmGatePrice;
        this.increaseOfCoffee = '$' + Math.ceil(this.farmGateProductPrice);
        break;
      case ApiBusinessToCustomerSettings.GraphicFarmGatePriceEnum.PERCENTVALUE:
        this.farmGateAveragePrice = Math.ceil(this.b2cSettings.averageRegionFarmGatePrice / B2cFairPricesComponent.POUND_TO_KG);
        this.farmGateProductPrice = farmGatePrice / this.farmGateAveragePrice * 100 - 100;
        this.increaseOfCoffee = '+' + Math.round(this.farmGateProductPrice) + '%';
        break;
    }

    // Calculate farm-gate graphic chart bars height
    const farmGateAveragePriceHeight = 100;
    let increaseOfCoffeeHeight: number = null;
    if (this.b2cSettings.graphicFarmGatePrice === GraphicFarmGatePriceEnum.PERCENTVALUE) {
      increaseOfCoffeeHeight = farmGateAveragePriceHeight * farmGatePrice / this.farmGateAveragePrice;
    } else {
      increaseOfCoffeeHeight = farmGateAveragePriceHeight * this.farmGateProductPrice / this.farmGateAveragePrice;
    }

    const farmGateGraphicScale = B2cFairPricesComponent.FARMGATE_GRAPHIC_HEIGHT / increaseOfCoffeeHeight;

    this.farmGateAveragePriceHeight = farmGateAveragePriceHeight * farmGateGraphicScale;
    this.increaseOfCoffeeHeight = increaseOfCoffeeHeight * farmGateGraphicScale - this.farmGateAveragePriceHeight;
  }

}

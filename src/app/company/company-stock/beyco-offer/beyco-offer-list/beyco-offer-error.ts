export function getBeycoOfferErrorMessage(body: any): string {
  const message = typeof body === 'string' ? body : body?.errorMessage;
  return typeof message === 'string' && message.length > 0 ? message :
      $localize`:@@beycoOrderList.notification.unsuccessfulOrder.message:There was an error when creating Beyco order! Please, try again!`;
}

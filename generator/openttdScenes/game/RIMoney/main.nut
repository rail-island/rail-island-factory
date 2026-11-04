// RIMoney (info.nut): tops up every company's bank balance a few times a day.

class RIMoney extends GSController {
  function Start();
}

function RIMoney::Start() {
  while (true) {
    for (local c = GSCompany.COMPANY_FIRST; c <= GSCompany.COMPANY_LAST; c++) {
      if (GSCompany.ResolveCompanyID(c) == GSCompany.COMPANY_INVALID) continue;
      if (GSCompany.GetBankBalance(c) < 500000000) GSCompany.ChangeBankBalance(c, 1000000000, GSCompany.EXPENSES_OTHER, GSMap.TILE_INVALID);
    }
    this.Sleep(20);
  }
}

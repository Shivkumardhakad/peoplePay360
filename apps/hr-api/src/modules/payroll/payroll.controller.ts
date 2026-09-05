import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HrService } from "../shared/hr.service";

@Controller("payroll")
export class PayrollController {
  constructor(private readonly hr: HrService) {}

  @Get("salary-categories") listCategories() { return this.hr.listSalaryRuleCategories(); }
  @Get("salary-categories/:id") getCategory(@Param("id") id: string) { return this.hr.getSalaryRuleCategory(id); }
  @Post("salary-categories") createCategory(@Body() body: Prisma.SalaryRuleCategoryCreateInput) { return this.hr.createSalaryRuleCategory(body); }
  @Patch("salary-categories/:id") updateCategory(@Param("id") id: string, @Body() body: Prisma.SalaryRuleCategoryUpdateInput) { return this.hr.updateSalaryRuleCategory(id, body); }
  @Delete("salary-categories/:id") deleteCategory(@Param("id") id: string) { return this.hr.deleteSalaryRuleCategory(id); }

  @Get("salary-rules") listRules() { return this.hr.listSalaryRules(); }
  @Get("salary-rules/:id") getRule(@Param("id") id: string) { return this.hr.getSalaryRule(id); }
  @Post("salary-rules") createRule(@Body() body: Prisma.SalaryRuleUncheckedCreateInput) { return this.hr.createSalaryRule(body); }
  @Patch("salary-rules/:id") updateRule(@Param("id") id: string, @Body() body: Prisma.SalaryRuleUncheckedUpdateInput) { return this.hr.updateSalaryRule(id, body); }
  @Delete("salary-rules/:id") deleteRule(@Param("id") id: string) { return this.hr.deleteSalaryRule(id); }

  @Get("salary-structures") listStructures() { return this.hr.listSalaryStructures(); }
  @Get("salary-structures/:id") getStructure(@Param("id") id: string) { return this.hr.getSalaryStructure(id); }
  @Post("salary-structures") createStructure(@Body() body: Prisma.SalaryStructureCreateInput) { return this.hr.createSalaryStructure(body); }
  @Patch("salary-structures/:id") updateStructure(@Param("id") id: string, @Body() body: Prisma.SalaryStructureUpdateInput) { return this.hr.updateSalaryStructure(id, body); }
  @Delete("salary-structures/:id") deleteStructure(@Param("id") id: string) { return this.hr.deleteSalaryStructure(id); }
  @Post("salary-structure-rules") addStructureRule(@Body() body: Prisma.SalaryStructureRuleUncheckedCreateInput) { return this.hr.addSalaryStructureRule(body); }
  @Patch("salary-structure-rules/:id") updateStructureRule(@Param("id") id: string, @Body() body: Prisma.SalaryStructureRuleUncheckedUpdateInput) { return this.hr.updateSalaryStructureRule(id, body); }
  @Delete("salary-structure-rules/:id") removeStructureRule(@Param("id") id: string) { return this.hr.removeSalaryStructureRule(id); }

  @Get("payruns") listPayruns() { return this.hr.listPayruns(); }
  @Get("payruns/:id") getPayrun(@Param("id") id: string) { return this.hr.getPayrun(id); }
  @Post("payruns") createPayrun(@Body() body: Prisma.PayrunUncheckedCreateInput & { employeeIds: string[] }) { return this.hr.createPayrun(body); }
  @Patch("payruns/:id") updatePayrun(@Param("id") id: string, @Body() body: Prisma.PayrunUncheckedUpdateInput) { return this.hr.updatePayrun(id, body); }
  @Post("payruns/:id/compute") computePayrun(@Param("id") id: string) { return this.hr.computePayrun(id); }
  @Get("payruns/:id/warnings") getPayrunWarnings(@Param("id") id: string) { return this.hr.getPayrunWarnings(id); }
  @Post("payruns/:id/validate") validatePayrun(@Param("id") id: string) { return this.hr.validatePayrun(id); }
  @Post("payruns/:id/mark-paid") markPayrunPaid(@Param("id") id: string) { return this.hr.markPayrunPaid(id); }
  @Post("payruns/:id/cancel") cancelPayrun(@Param("id") id: string) { return this.hr.cancelPayrun(id); }

  @Get("payslips") listPayslips() { return this.hr.listPayslips(); }
  @Get("payslips/:id") getPayslip(@Param("id") id: string) { return this.hr.getPayslip(id); }
  @Patch("payslips/:id") updatePayslip(@Param("id") id: string, @Body() body: Prisma.PayslipUncheckedUpdateInput) { return this.hr.updatePayslip(id, body); }
}

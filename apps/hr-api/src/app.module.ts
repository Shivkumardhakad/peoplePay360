import { Module } from "@nestjs/common";
import { HrModule } from "./modules/hr.module";

@Module({
  imports: [HrModule]
})
export class AppModule {}

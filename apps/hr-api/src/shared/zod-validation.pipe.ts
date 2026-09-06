import { BadRequestException, type ArgumentMetadata, type PipeTransform } from "@nestjs/common";
import { z } from "zod";

export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({ message: "Validation failed", errors: result.error.issues });
    }
    return result.data;
  }
}

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Section } from "./section.entity";
import { UpdateSectionDto } from "./dto/update-section.dto";

@Injectable()
export class SectionsService {
  constructor(
    @InjectModel(Section.name) private sectionModel: Model<Section>
  ) {}

  async update(
    id: string,
    updateSectionDto: UpdateSectionDto
  ): Promise<Section> {
    const session = await this.sectionModel.db.startSession();
    session.startTransaction();

    try {
      // First get the current section to preserve the order
      const currentSection = await this.sectionModel
        .findById(id)
        .session(session);
      if (!currentSection) {
        throw new Error("Section not found");
      }

      // Update while preserving the order field
      const section = await this.sectionModel
        .findByIdAndUpdate(
          id,
          { ...updateSectionDto, order: currentSection.order },
          { new: true, session }
        )
        .exec();

      await session.commitTransaction();
      return section;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

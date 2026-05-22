import { Types } from 'mongoose';
import Shift, { IShift } from '../models/Shift.js';

export class ShiftRepository {
  async getShiftList(startDate?: Date, endDate?: Date) {
    const filter: any = { isCancelled: false };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = startDate;
      }
      if (endDate) {
        filter.date.$lte = endDate;
      }
    }

    return Shift.find(filter)
      .populate('assignedStaff', 'fullName email phone role status performanceScore')
      .sort({ date: 1, startTime: 1 })
      .exec();
  }

  async getShiftById(id: string) {
    return Shift.findOne({ _id: id, isCancelled: false })
      .populate('assignedStaff', 'fullName email phone role status')
      .exec();
  }

  async createShift(data: {
    title: string;
    startTime: string;
    endTime: string;
    color?: string;
    bg?: string;
    date: Date;
    assignedStaff: string[];
  }) {
    const shift = new Shift({
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
      color: data.color,
      bg: data.bg,
      date: data.date,
      assignedStaff: data.assignedStaff.map(id => new Types.ObjectId(id)),
    });

    const savedShift = await shift.save();
    return savedShift.populate('assignedStaff', 'fullName email phone role status');
  }

  async updateShift(id: string, data: any) {
    const shift = await Shift.findOne({ _id: id, isCancelled: false });
    if (!shift) return null;

    if (data.title !== undefined) shift.title = data.title;
    if (data.startTime !== undefined) shift.startTime = data.startTime;
    if (data.endTime !== undefined) shift.endTime = data.endTime;
    if (data.color !== undefined) shift.color = data.color;
    if (data.bg !== undefined) shift.bg = data.bg;
    if (data.date !== undefined) shift.date = data.date;
    if (data.assignedStaff !== undefined) {
      shift.assignedStaff = data.assignedStaff.map((staffId: string) => new Types.ObjectId(staffId));
    }

    const updatedShift = await shift.save();
    return updatedShift.populate('assignedStaff', 'fullName email phone role status');
  }

  async cancelShift(id: string, cancelledByUserId: string) {
    return Shift.findByIdAndUpdate(
      id,
      {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledBy: new Types.ObjectId(cancelledByUserId),
      },
      { new: true }
    )
      .populate('assignedStaff', 'fullName email phone role status')
      .exec();
  }
}

export const shiftRepository = new ShiftRepository();

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RentalStatus } from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { Scooter } from '../scooters/scooter.entity';

@Entity('rentals')
export class Rental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'scooter_id' })
  scooterId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Scooter)
  @JoinColumn({ name: 'scooter_id' })
  scooter: Scooter;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({
    type: 'enum',
    enum: RentalStatus,
    default: RentalStatus.ACTIVE,
  })
  status: RentalStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

export interface RentalWithDuration extends Rental {
  durationMinutes: number | null;
}

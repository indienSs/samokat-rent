import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import { UserRole, ScooterStatus, RentalStatus } from '../common/enums';
import { Scooter } from '../scooters/scooter.entity';
import { Customer } from '../customers/customer.entity';
import { Rental } from '../rentals/rental.entity';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Scooter) private readonly scooters: Repository<Scooter>,
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(Rental) private readonly rentals: Repository<Rental>,
    private readonly config: ConfigService,
    private readonly events: EventsGateway,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
    const seeded = await this.seedDemoData();
    if (seeded) {
      this.events.emitScooterChanged({ action: 'updated', scooter: {} });
    }
  }

  private async seedAdmin() {
    const email =
      this.config.get<string>('SEED_ADMIN_EMAIL', 'admin@example.com') ??
      'admin@example.com';
    const password =
      this.config.get<string>('SEED_ADMIN_PASSWORD', 'admin123') ??
      'admin123';
    const name =
      this.config.get<string>('SEED_ADMIN_NAME', 'Admin') ?? 'Admin';

    const exists = await this.users.findOne({ where: { email } });
    if (exists) {
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await this.users.save(
      this.users.create({
        email,
        passwordHash,
        name,
        role: UserRole.ADMIN,
      }),
    );
    this.logger.log(`Seeded admin user: ${email}`);
  }

  private async seedDemoData(): Promise<boolean> {
    const scooterCount = await this.scooters.count();
    if (scooterCount > 0) {
      return false;
    }

    const center = { lat: 55.751244, lng: 37.618423 };

    const scooterDefs: Array<{
      number: string;
      model: string;
      status: ScooterStatus;
      batteryLevel: number;
      dLat: number;
      dLng: number;
    }> = [
      { number: 'SC-001', model: 'Xiaomi M365', status: ScooterStatus.AVAILABLE, batteryLevel: 92, dLat: 0.004, dLng: 0.003 },
      { number: 'SC-002', model: 'Xiaomi Pro 2', status: ScooterStatus.AVAILABLE, batteryLevel: 78, dLat: -0.003, dLng: 0.005 },
      { number: 'SC-003', model: 'Segway Ninebot', status: ScooterStatus.IN_USE, batteryLevel: 54, dLat: 0.006, dLng: -0.002 },
      { number: 'SC-004', model: 'Xiaomi M365', status: ScooterStatus.AVAILABLE, batteryLevel: 88, dLat: -0.005, dLng: -0.004 },
      { number: 'SC-005', model: 'Kugoo S3', status: ScooterStatus.MAINTENANCE, batteryLevel: 23, dLat: 0.002, dLng: 0.007 },
      { number: 'SC-006', model: 'Segway Ninebot', status: ScooterStatus.OFFLINE, batteryLevel: 5, dLat: -0.007, dLng: 0.001 },
      { number: 'SC-007', model: 'Xiaomi Pro 2', status: ScooterStatus.AVAILABLE, batteryLevel: 65, dLat: 0.008, dLng: 0.006 },
      { number: 'SC-008', model: 'Kugoo S3', status: ScooterStatus.AVAILABLE, batteryLevel: 41, dLat: -0.002, dLng: -0.008 },
    ];

    const scooters = await this.scooters.save(
      scooterDefs.map((d) =>
        this.scooters.create({
          number: d.number,
          model: d.model,
          status: d.status,
          batteryLevel: d.batteryLevel,
          lat: center.lat + d.dLat,
          lng: center.lng + d.dLng,
        }),
      ),
    );

    const customerDefs = [
      { name: 'Иван Петров', phone: '+7 900 100-10-10' },
      { name: 'Анна Смирнова', phone: '+7 900 200-20-20' },
      { name: 'Дмитрий Иванов', phone: '+7 900 300-30-30' },
    ];
    const customers = await this.customers.save(
      customerDefs.map((c) => this.customers.create(c)),
    );

    const inUse = scooters.find((s) => s.number === 'SC-003');
    if (inUse) {
      await this.rentals.save(
        this.rentals.create({
          scooterId: inUse.id,
          customerId: customers[0].id,
          startedAt: new Date(Date.now() - 25 * 60 * 1000),
          status: RentalStatus.ACTIVE,
        }),
      );
    }

    this.logger.log(
      `Seeded demo data: ${scooters.length} scooters, ${customers.length} customers, 1 active rental`,
    );
    return true;
  }
}

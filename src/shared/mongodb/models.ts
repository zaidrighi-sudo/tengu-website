// Barrel file re-exporting the models and the DB connection.
export { connectDB } from "@/shared/mongodb/connection"
export { Admin, type IAdmin } from '@/features/auth/admin-model'
export { User, type IUser, type IAddress } from '@/features/customers/model'
export { Product, type IProduct } from '@/features/products/model'
export { Category, type ICategory } from '@/features/categories/model'
export { Color, type IColor } from '@/features/colors/model'
export { Order, type IOrder, type IOrderLine, type ICustomer, type IAddress as IOrderAddress } from '@/features/orders/model'
export { Message, type IMessage } from '@/features/messages/model'
export { Subscriber, type ISubscriber } from '@/features/subscribers/model'
export { Media, type IMedia } from '@/features/media/model'
export { SiteSettings, type ISiteSettings, type ILocalizedText } from '@/features/site-settings/model'
export { DeliverySettings, type IDeliverySettings, type IZone, type ICommuneFee } from '@/features/delivery/model'

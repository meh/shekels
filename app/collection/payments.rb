class Payments < Lissio::Collection
	model Payment
	adapter Lissio::Adapter::Storage
end

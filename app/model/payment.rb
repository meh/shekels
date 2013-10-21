class Payment < Lissio::Model
	adapter Lissio::Adapter::Storage

	property :for, primary: true
	property :amount, as: Float
end

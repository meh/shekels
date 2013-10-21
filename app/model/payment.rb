class Payment < Lissio::Model
	adapter Lissio::Adapter::Storage do
		autoincrement :id
	end

	property :id, as: Integer, primary: true
	property :for
	property :at, as: Time, default: -> { Time.now }
	property :amount, as: Float
	property :sign, as: Symbol
	property :satisfied, as: Boolean

	alias satisfied? satisfied
end
